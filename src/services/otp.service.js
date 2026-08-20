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
  markPhoneNumberVerified,
  verifiedEmail,
  verifiedPhone,
} from "../repositories/user.repository.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { consumeOtpRequestLimit } from "./otp-rate-limit.service.js";

import { badRequest, notFound } from "../utils/index.js";
import { sendWhatsappOtp } from "../utils/fonnte.js";

const OTP_TYPE_EMAIL = "EMAIL";
const OTP_TYPE_PHONE = "PHONE_NUMBER";

async function issueOtp(userId, type, target) {
  const plainOtp = crypto.randomInt(100000, 1000000).toString();

  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(plainOtp, salt);

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await createOtp({
    userId,
    type,
    target,
    otpHash,
    expiresAt,
  });

  return { plainOtp, expiresAt };
}

async function consumeOtp(userId, type, otpInput) {
  const activeOtp = await findActiveOtpByUserId(userId, type);

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

  await invalidateOtp(activeOtp.id);

  return activeOtp;
}

async function sendEmailOtp(existingUser) {
  const isEmailVerified = await verifiedEmail(existingUser.id);
  if (isEmailVerified) {
    throw badRequest("Email already verified");
  }

  await consumeOtpRequestLimit("email", existingUser.email);

  const activeOtp = await findActiveOtpByUserId(existingUser.id, OTP_TYPE_EMAIL);
  if (activeOtp) {
    await invalidateOtp(activeOtp.id);
  }

  const { plainOtp, expiresAt } = await issueOtp(
    existingUser.id,
    OTP_TYPE_EMAIL,
    existingUser.email,
  );

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

async function sendPhoneNumberOtp(existingUser) {
  if (!existingUser.phoneNumber) {
    throw badRequest("Phone number is not set on this account");
  }

  const isPhoneNumberVerified = await verifiedPhone(existingUser.id);
  if (isPhoneNumberVerified) {
    throw badRequest("Phone number already verified");
  }

  await consumeOtpRequestLimit("phone", existingUser.id);

  const activeOtp = await findActiveOtpByUserId(existingUser.id, OTP_TYPE_PHONE);
  if (activeOtp) {
    await invalidateOtp(activeOtp.id);
  }

  const { plainOtp, expiresAt } = await issueOtp(
    existingUser.id,
    OTP_TYPE_PHONE,
    existingUser.phoneNumber,
  );

  await sendWhatsappOtp({
    target: existingUser.phoneNumber,
    message: `Kode OTP verifikasi nomor WhatsApp Anda: ${plainOtp}. Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`,
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

export async function requestPhoneNumberOtpByUserId(userId) {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw notFound("User not found");
  }

  return await sendPhoneNumberOtp(existingUser);
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

  const isEmailVerified = await verifiedEmail(existingUser.id);
  if (isEmailVerified) {
    throw badRequest("User already verified");
  }

  await consumeOtp(existingUser.id, OTP_TYPE_EMAIL, otpInput);

  await markEmailVerified(existingUser.id);

  return {
    success: true,
    message: "Email verified successfully",
  };
}

export async function verifyPhoneNumberOtpByUserId(userId, otpInput) {
  const existingUser = await findUserById(userId);
  if (!existingUser) {
    throw notFound("User not found");
  }

  const isPhoneNumberVerified = await verifiedPhone(existingUser.id);
  if (isPhoneNumberVerified) {
    throw badRequest("Phone number already verified");
  }

  await consumeOtp(existingUser.id, OTP_TYPE_PHONE, otpInput);

  await markPhoneNumberVerified(existingUser.id);

  return {
    success: true,
    message: "Phone number verified successfully",
  };
}
