import {
  createAccount,
  findUserByEmail,
  findUserByPhone,
  findOrCreateGoogleUser,
} from "../repositories/user.repository.js";
import { requestEmailOtpByUserId } from "./otp.service.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { OAuth2Client } from "google-auth-library";

import { badRequest, isEmail, isValidPhone } from "../utils/index.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export function sanitizeUser(account) {
  return {
    id: account.id,
    email: account.email,
    email_verified: account.emailVerified,
    username: account.name,
    phone_number: account.phoneNumber,
    role: account.role,
    createdAt: account.createdAt,
  };
}

export async function registerService({
  email,
  password,
  username,
  phone_number,
}) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();

  if (!email || !password || !username) {
    throw badRequest("Email, password, and username are required");
  }
  if (!isEmail(normalizedEmail)) {
    throw badRequest("Invalid email format");
  }
  if (password.length < 6) {
    throw badRequest("Password must be at least 6 characters");
  }
  if (phone_number && !isValidPhone(phone_number)) {
    throw badRequest("Invalid phone number format");
  }

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    throw badRequest("Email already taken");
  }

  if (phone_number) {
    const existingPhone = await findUserByPhone(phone_number);
    if (existingPhone) {
      throw badRequest("Phone number already taken");
    }
  }

  const passwordHash = await hashPassword(password);
  const account = await createAccount({
    email: normalizedEmail,
    password: passwordHash,
    username,
    role: "user",
    phone_number,
  });

  await requestEmailOtpByUserId(account.id);

  return {
    account: sanitizeUser(account),
    message: "OTP has been sent to your email",
  };
}

export async function loginService({ email, password }) {
  if (!email || !password) {
    throw badRequest("Invalid email or password");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const account = await findUserByEmail(normalizedEmail);
  if (!account) {
    throw badRequest("Invalid email or password");
  }

  if (!account.password) {
    throw badRequest(
      "This account is registered via Google. Please login using Google.",
    );
  }

  const ok = await comparePassword(password, account.password);
  if (!ok) {
    throw badRequest("Invalid email or password");
  }

  if (!account.emailVerified) {
    throw badRequest(
      "Your email has not been verified. Please verify the OTP first.",
    );
  }

  const token = signToken({
    sub: account.id,
    email: account.email,
    role: account.role,
  });
  return { account: sanitizeUser(account), token };
}

export async function googleLoginService({ id_token }) {
  if (!id_token) {
    throw badRequest("id_token is required");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    throw badRequest("Invalid Google id_token");
  }

  if (!payload.email_verified) {
    throw badRequest("Google email is not verified");
  }

  const account = await findOrCreateGoogleUser({
    email: payload.email,
    name: payload.name || payload.email.split("@")[0],
  });

  const token = signToken({
    sub: account.id,
    email: account.email,
    role: account.role,
  });

  return { account: sanitizeUser(account), token };
}
