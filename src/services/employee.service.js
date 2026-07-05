import {
    findEmail,
    getAllAdminAccount,
    getAllUserAccount,
    isAdminRole,
    removeAdmin,
    setAdmin
} from "../repositories/employee.repository.js";

import {
    badRequest,
    conflict,
    isEmail,
    notFound
} from "../utils/index.js";


export async function getAllUserAccountService() {
    return await getAllUserAccount()
}

export async function getAllAdminAccountService() {
    return await getAllAdminAccount()
}

export async function setAdminService(email) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase()

    if (!isEmail(normalizedEmail)) {
        throw badRequest("Invalid email format")
    }

    const existing = await findEmail(normalizedEmail)
    if (!existing) {
        throw notFound("Email not found")
    }

    const isAdmin = await isAdminRole(normalizedEmail)
    if (isAdmin) {
        throw conflict("This account is already an admin")
    }

    return await setAdmin(normalizedEmail)
}

export async function removeAdminService(email) {
    const normalizedEmail = String(email ?? "").trim().toLowerCase()

    if (!isEmail(normalizedEmail)) {
        throw badRequest("Invalid email format")
    }

    const existing = await findEmail(normalizedEmail)
    if (!existing) {
        throw notFound("Email not found")
    }

    const isAdmin = await isAdminRole(normalizedEmail)
    if (!isAdmin) {
        throw badRequest("This account is not an admin")
    }

    return await removeAdmin(normalizedEmail)
}