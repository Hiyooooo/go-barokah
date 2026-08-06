import prisma from "../config/prisma.js";

export async function createOtp({ userId, type = "EMAIL", target = null, otpHash, expiresAt }) {
  return await prisma.otp.create({
    data: {
      userId: userId,
      type: type,
      target: target,
      otpHash: otpHash,
      expiresAt: expiresAt,
      usedAt: null,
    },
  });
}

export async function findActiveOtpByUserId(userId, type = "EMAIL") {
  return await prisma.otp.findFirst({
    where: {
      userId: userId,
      type: type,
      usedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function invalidateOtp(id) {
  return await prisma.otp.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
