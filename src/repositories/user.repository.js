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

export async function getUserProfile(userId) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phoneNumber: true,
      emailVerified: true,
      phoneNumberVerified: true,
      createdAt: true,
      updatedAt: true,
    },
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
      ...(data.phoneNumberVerified !== undefined && {
        phoneNumberVerified: data.phoneNumberVerified,
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phoneNumber: true,
      emailVerified: true,
      phoneNumberVerified: true,
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

export async function verifiedPhone(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phoneNumberVerified: true },
  });
  return Boolean(user?.phoneNumberVerified);
}

export async function markEmailVerified(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true },
  });
}

export async function markPhoneNumberVerified(userId) {
  return await prisma.user.update({
    where: { id: userId },
    data: { phoneNumberVerified: true },
  });
}

export async function findOrCreateGoogleUser({ email, name }) {
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }
    return user;
  }

  return await prisma.user.create({
    data: {
      name,
      email,
      password: null,
      role: "user",
      emailVerified: true,
    },
  });
}
