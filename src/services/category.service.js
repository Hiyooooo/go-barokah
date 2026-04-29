import {
  createCategory,
  deleteCategory,
  findCategoryById,
  findCategoryByName,
  getAllCategory,
  updateCategory,
} from "../repositories/category.repository.js";
import {
  badRequest,
  conflict,
  isNonEmptyString,
  notFound,
  parsePositiveInt,
} from "../utils/index.js";

function parseCategoryId(id) {
  return parsePositiveInt(id, "category id");
}

async function getExistingCategoryOrThrow(id) {
  const existing = await findCategoryById(parseCategoryId(id));

  if (!existing) {
    throw notFound("Category not found");
  }

  return existing;
}

function validateCategoryPayload(data) {
  if (!data || data.name === undefined) {
    throw badRequest("name is required");
  }

  if (!isNonEmptyString(data.name)) {
    throw badRequest("Name must be non-empty string");
  }
}

export async function getAllCategoryService() {
  const category = await getAllCategory();

  return category;
}

export async function getCategoryByIdService(id) {
  const existing = await getExistingCategoryOrThrow(id);

  return existing;
}

export async function createCategoryService(data) {
  validateCategoryPayload(data);

  const normalizedName = data.name.trim();
  const existing = await findCategoryByName(normalizedName);

  if (existing) {
    throw conflict("Category name already exists");
  }

  const payload = {
    name: normalizedName,
  };

  const result = await createCategory(payload);

  return result;
}

export async function updateCategoryService(id, data) {
  const existingCategory = await getExistingCategoryOrThrow(id);

  validateCategoryPayload(data);

  const normalizedName = data.name.trim();
  const duplicate = await findCategoryByName(normalizedName);

  if (duplicate && duplicate.id !== existingCategory.id) {
    throw conflict("Category name already exists");
  }

  const payload = {
    name: normalizedName,
  };

  const result = await updateCategory(existingCategory.id, payload);

  return result;
}

export async function deleteCategoryService(id) {
  const existingCategory = await getExistingCategoryOrThrow(id);

  const result = await deleteCategory(existingCategory.id);

  return result;
}
