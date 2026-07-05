import prisma from "../config/prisma.js"

export async function findEmail(email) {
    return await prisma.user.findUnique({
        where: { email }
    })
}

export async function getAllUserAccount() {
    return await prisma.user.findMany({
        where: { role: "user" },
        select: {
            name: true,
            email: true,
            role: true
        }
    })
}

export async function getAllAdminAccount() {
    return await prisma.user.findMany({
        where: { role: "admin" },
        select: {
            name: true,
            email: true,
            role: true
        }
    })
}

export async function isAdminRole(email) {
    const user = await prisma.user.findFirst({
        where: {
            email: email,
            role: "admin"
        }
    })
    return !!user
}

export async function setAdmin(email) {
    return await prisma.user.update({
        where: { email: email },
        data: { role: "admin" },
        select: {
            name: true,
            email: true,
            role: true
        }
    })
}

export async function removeAdmin(email) {
    return await prisma.user.update({
        where: { email: email },
        data: { role: "user" },
        select: {
            name: true,
            email: true,
            role: true
        }

    })
}