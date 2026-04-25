import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createOtp,
  findActiveOtpByUserId,
  invalidateOtp,
} from "../repositories/otp.repository.js";
import {
  findUserById,
  findUserByEmail,
  markEmailVerified,
  verifiedEmail,
} from "../repositories/user.repository.js";
import { sendOtpEmail } from "../utils/mailer.js";

import { badRequest, notFound } from "../utils/index.js";

async function sendEmailOtp(existingUser) {
  const userId = existingUser.id;

  const isEmailVerified = await verifiedEmail(userId);
  if (isEmailVerified) {
    throw badRequest("Email already verified");
  }

  const plainOtp = crypto.randomInt(100000, 1000000).toString();

  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plainOtp, salt);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createOtp({
    userId,
    otpHash,
    expiresAt,
  });

  await sendOtpEmail({
    to: existingUser.email,
    otp: plainOtp,
  });

  return {
    success: true,
    message: "OTP sent successfully",
    expiresAt,
  };
}

export async function requestEmailOtpByUserId(userId) {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw notFound("User not found");
  }

  return await sendEmailOtp(existingUser);
}

export async function requestEmailOtpByEmail(email) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) {
    throw badRequest("Email is required");
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (!existingUser) {
    throw notFound("User not found");
  }

  return await sendEmailOtp(existingUser);
}

export async function verifyEmailOtpByEmail(email, otpInput) {
  const normalizedEmail = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!normalizedEmail) {
    throw badRequest("Email is required");
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (!existingUser) {
    throw notFound("User not found");
  }

  const userId = existingUser.id;
  const isEmailVerified = await verifiedEmail(userId);
  if (isEmailVerified) {
    throw badRequest("User already verified");
  }

  const activeOtp = await findActiveOtpByUserId(userId);

  if (!activeOtp) {
    throw notFound("Active OTP not found");
  }

  if (new Date() > new Date(activeOtp.expiresAt)) {
    await invalidateOtp(activeOtp.id);

    throw badRequest("OTP expired");
  }

  const otp = String(otpInput).trim();

  const isMatch = await bcrypt.compare(otp, activeOtp.otpHash);
  if (!isMatch) {
    throw badRequest("Invalid OTP");
  }

  await markEmailVerified(userId);

  await invalidateOtp(activeOtp.id);

  return {
    success: true,
    message: "Email verified successfully",
  };
}
