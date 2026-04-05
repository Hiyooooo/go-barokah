import prisma from "../config/prisma.js";

export async function createOtp({ userId, otpHash, expiresAt }) {
  return await prisma.emailOtp.create({
    data: {
      userId: userId,
      otpHash: otpHash,
      expiresAt: expiresAt,
      usedAt: null,
    },
  });
}

export async function findActiveOtpByUserId(userId) {
  return await prisma.emailOtp.findFirst({
    where: {
      userId: userId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function invalidateOtp(id) {
  return await prisma.emailOtp.update({
    where: { id },
    data: { usedAt: new Date() },
  });
}
