import {
  createAccount,
  findUserByEmail,
  findUserByPhone,
} from "../repositories/user.repository.js";
import { requestEmailOtpByUserId } from "./otp.service.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

function createBadRequestError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function isValidPhone(phone) {
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return regex.test(phone);
}

export function sanitizeUser(account) {
  return {
    id: account.id,
    email: account.email,
    email_verified: account.emailVerified,
    username: account.name,
    phone_number: account.phoneNumber,
    image_url: account.imageUrl,
    role: account.role,
    createdAt: account.createdAt,
  };
}

export async function registerService({
  email,
  password,
  username,
  phone_number,
  image_url,
}) {
  const normalizedEmail = String(email ?? "").trim().toLowerCase();

  if (!email || !password || !username) {
    throw createBadRequestError(
      "Email, password, and username are required"
    );
  }
  if (!isEmail(normalizedEmail)) {
    throw createBadRequestError("Invalid email format");
  }
  if (password.length < 6) {
    throw createBadRequestError("Password must be at least 6 characters");
  }
  if (phone_number && !isValidPhone(phone_number)) {
    throw createBadRequestError("Invalid phone number format");
  }

  const existingEmail = await findUserByEmail(normalizedEmail);
  if (existingEmail) {
    throw createBadRequestError("Email already taken");
  }

  if (phone_number) {
    const existingPhone = await findUserByPhone(phone_number);
    if (existingPhone) {
      throw createBadRequestError("Phone number already taken");
    }
  }

  const passwordHash = await hashPassword(password);
  const account = await createAccount({
    email: normalizedEmail,
    password: passwordHash,
    username,
    role: "user",
    phone_number,
    image_url,
  });

  await requestEmailOtpByUserId(account.id);

  return {
    account: sanitizeUser(account),
    message: "OTP has been sent to your email",
  };
}

export async function loginService({ email, password }) {
  if (!email || !password) {
    throw createBadRequestError("Invalid username or password");
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const account = await findUserByEmail(normalizedEmail);
  if (!account) {
    throw createBadRequestError("Invalid username or password");
  }

  const ok = await comparePassword(password, account.password);
  if (!ok) {
    throw createBadRequestError("Invalid username or password");
  }

  if (!account.emailVerified) {
    throw createBadRequestError(
      "Email belum terverifikasi. Silakan verifikasi OTP terlebih dahulu"
    );
  }

  const token = signToken({
    sub: account.id,
    email: account.email,
    role: account.role,
  });
  return { account: sanitizeUser(account), token };
}
