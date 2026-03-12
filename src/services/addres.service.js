import { createAdress, deleteAddress, findById, getAllAdress, updateAdress } from "../repositories/address.repository.js"

function createNotFoundError() {
    const err = new Error("Address not found");
    err.statusCode = 404;
    return err;
}

export async function getAllAdressService(userId) {
    return await getAllAdress(userId);
}

export async function getAddressByIdService(id, userId) {
    const existing = await findById(id, userId);
    if (!existing) {
        throw createNotFoundError();
    }

    return existing;
}

export async function createAddressService(data) {
    return await createAdress(data);
}

export async function updateAddressService(id, userId, data) {
    const existing = await findById(id, userId);
    if (!existing) {
        throw createNotFoundError();
    }

    return await updateAdress(id, userId, data);
}

export async function deleteAddressService(id, userId) {
    const existing = await findById(id, userId);
    if (!existing) {
        throw createNotFoundError();
    }

    return await deleteAddress(id);
}
