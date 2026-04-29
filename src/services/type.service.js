import {
  createType,
  deleteType,
  findTypeById,
  findTypeByName,
  getAllType,
  updateType,
} from "../repositories/type.repository.js";

import {
  badRequest,
  conflict,
  isNonEmptyString,
  notFound,
  parsePositiveInt,
} from "../utils/index.js";

async function getExistingTypeOrThrow(id) {
  const existing = await findTypeById(parsePositiveInt(id, "type id"));

  if (!existing) {
    throw notFound("Type not found");
  }

  return existing;
}

function validateTypePayload(data) {
  if (!data || data.name === undefined) {
    throw badRequest("name is required");
  }

  if (!isNonEmptyString(data.name)) {
    throw badRequest("Name must be a non-empty string");
  }
}

export async function getAllTypeService() {
  const types = await getAllType();

  return types;
}

export async function getTypeByIdService(id) {
  const existing = await getExistingTypeOrThrow(id);

  return existing;
}

export async function createTypeService(data) {
  validateTypePayload(data);

  const normalizedName = data.name.trim();
  const existing = await findTypeByName(normalizedName);

  if (existing) {
    throw conflict("Type name already exists");
  }

  const payload = {
    name: normalizedName,
  };

  const result = await createType(payload);

  return result;
}

export async function updateTypeService(id, data) {
  const existingType = await getExistingTypeOrThrow(id);

  validateTypePayload(data);

  const normalizedName = data.name.trim();
  const duplicate = await findTypeByName(normalizedName);

  if (duplicate && duplicate.id !== existingType.id) {
    throw conflict("Type name already exists");
  }

  const payload = {
    name: normalizedName,
  };

  const result = await updateType(existingType.id, payload);

  return result;
}

export async function deleteTypeService(id) {
  const existingType = await getExistingTypeOrThrow(id);

  const result = await deleteType(existingType.id);

  return result;
}
