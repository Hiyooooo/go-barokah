import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  createOtp,
  findActiveOtpByUserId,
  invalidateOtp,
} from "../repositories/otp.repository.js";
import {
  findUserById,
  markEmailVerified,
  verifiedEmail,
} from "../repositories/user.repository.js";
import { sendOtpEmail } from "../utils/mailer.js";

export async function requestEmailOtp(userId) {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const isEmailVerified = await verifiedEmail(userId);
  if (isEmailVerified) {
    const err = new Error("Email already verified");
    err.statusCode = 400;
    throw err;
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

export async function verifyEmailOtp(userId, otpInput) {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const isEmailVerified = await verifiedEmail(userId);
  if (isEmailVerified) {
    const err = new Error("User already verified");
    err.statusCode = 400;
    throw err;
  }

  const activeOtp = await findActiveOtpByUserId(userId);

  if (!activeOtp) {
    const err = new Error("Active OTP not found");
    err.statusCode = 404;
    throw err;
  }

  if (new Date() > new Date(activeOtp.expiresAt)) {
    await invalidateOtp(activeOtp.id);

    const err = new Error("OTP expired");
    err.statusCode = 400;
    throw err;
  }

  const otp = String(otpInput).trim();

  const isMatch = await bcrypt.compare(otp, activeOtp.otpHash);
  if (!isMatch) {
    const err = new Error("Invalid OTP");
    err.statusCode = 400;
    throw err;
  }

  await markEmailVerified(userId);

  await invalidateOtp(activeOtp.id);

  return {
    success: true,
    message: "Email verified successfully",
  };
}
