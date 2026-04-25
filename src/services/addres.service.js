import {
  createAddress,
  deleteAddress,
  findAddressById,
  getAllAddress,
  updateAddress,
} from "../repositories/address.repository.js";

import {
  badRequest,
  isValidPhone,
  notFound,
  parsePositiveInt,
} from "../utils/index.js";

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return undefined;
}

function parseAddressId(id) {
  return parsePositiveInt(id, "address id");
}

export async function getAllAdressService(userId) {
  return await getAllAddress(userId);
}

export async function getAddressByIdService(id, userId) {
  const parsedId = parseAddressId(id);
  const existing = await findAddressById(parsedId, userId);
  if (!existing) {
    throw notFound("Product not found");
  }

  return existing;
}

export async function createAddressService(userId, payload) {
  const { label, recipient_name, recipient_phone, address_detail, is_default } =
    payload;
  const parsedIsDefault = normalizeBoolean(is_default);

  if (!label || !recipient_name || !recipient_phone || !address_detail) {
    throw badRequest(
      "Label, recipient name, recipient phone, and address detail are required",
    );
  }

  if (is_default !== undefined && parsedIsDefault === undefined) {
    throw badRequest("is_default must be boolean");
  }

  if (!isValidPhone(recipient_phone)) {
    throw badRequest("Invalid phone number format");
  }

  const data = {
    userId,
    label,
    recipient_name,
    recipient_phone,
    address_detail,
    is_default: parsedIsDefault ?? false,
  };

  return await createAddress(data);
}

export async function updateAddressService(id, userId, payload) {
  const parsedId = parseAddressId(id);
  const existing = await findAddressById(parsedId, userId);
  if (!existing) {
    throw notFound("Address not found");
  }

  const { label, recipient_name, recipient_phone, address_detail, is_default } =
    payload;
  const parsedIsDefault = normalizeBoolean(is_default);

  if (is_default !== undefined && parsedIsDefault === undefined) {
    throw badRequest("is_default must be boolean");
  }

  if (recipient_phone !== undefined && !isValidPhone(recipient_phone)) {
    throw badRequest("Invalid phone number format");
  }

  const data = {
    ...(label !== undefined && { label }),
    ...(recipient_name !== undefined && { recipient_name }),
    ...(recipient_phone !== undefined && { recipient_phone }),
    ...(address_detail !== undefined && { address_detail }),
    ...(parsedIsDefault !== undefined && { is_default: parsedIsDefault }),
  };

  return await updateAddress(parsedId, userId, data);
}

export async function deleteAddressService(id, userId) {
  const parsedId = parseAddressId(id);
  const existing = await findAddressById(parsedId, userId);
  if (!existing) {
    throw notFound("Address not found");
  }

  return await deleteAddress(parsedId);
}
