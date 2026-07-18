import prisma from "../config/prisma.js";

export async function findUserByEmail(email) {
  return await prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByPhone(phone_number) {
  return await prisma.user.findFirst({
    where: { phoneNumber: phone_number },
  });
}

export async function findUserById(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

export async function createAccount({
  email,
  password,
  username,
  role = "user",
  phone_number,
}) {
  return await prisma.user.create({
    data: {
      name: username,
      email,
      password,
      role,
      phoneNumber: phone_number,
    },
  });
}

export async function updateAccount(userId, data) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.username,
      phoneNumber: data.phone_number,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phoneNumber: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function verifiedEmail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });
  return Boolean(user?.emailVerified);
}

export async function markEmailVerified(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
}
