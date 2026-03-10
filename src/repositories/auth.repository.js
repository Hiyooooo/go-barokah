import prisma from "../config/prisma.js";

export async function findByEmail(email) {
    return await prisma.user.findUnique({
        where: { email }
    });
}

export async function findByPhone(phone_number) {
    return await prisma.user.findFirst({
        where: { phoneNumber: phone_number }
    });
}

export async function findById(id) {
    return await prisma.user.findUnique({
        where: { id }
    });
}

export async function createAccount({
    email,
    password,
    username,
    role = "user",
    phone_number,
    image_url
}) {
    return await prisma.user.create({
        data: {
            name: username,
            email,
            password,
            role,
            phoneNumber: phone_number,
            imageUrl: image_url
        }
    });
}