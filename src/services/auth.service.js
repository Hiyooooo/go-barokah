import {
  createAccount,
  findUserByEmail,
  findUserByPhone,
} from "../repositories/user.repository.js";
import { requestEmailOtpByUserId } from "./otp.service.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

import { badRequest, isEmail, isValidPhone } from "../utils/index.js";

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

  const ok = await comparePassword(password, account.password);
  if (!ok) {
    throw badRequest("Invalid email or password");
  }

  if (!account.emailVerified) {
    throw badRequest(
      "Email belum terverifikasi. Silakan verifikasi OTP terlebih dahulu",
    );
  }

  const token = signToken({
    sub: account.id,
    email: account.email,
    role: account.role,
  });
  return { account: sanitizeUser(account), token };
}
