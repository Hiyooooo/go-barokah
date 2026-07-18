import {
  createProduct,
  deleteProduct,
  findProductById,
  getAllProducts,
  updateProduct,
  findLowStockProducts,
} from "../repositories/product.repository.js";
import { findCategoryById } from "../repositories/category.repository.js";
import { findTypeById } from "../repositories/type.repository.js";
import {
  badRequest,
  deletelocalUploadFile,
  isEmptyValue,
  isLocalUploadPath,
  isNonEmptyString,
  notFound,
  parseIntegerInRange,
  parseNonNegativeInteger,
  parseNonNegativeNumber,
  parsePositiveInt,
  sendLowStockAlertEmail,
} from "../utils/index.js";

function parseProductId(id) {
  return parsePositiveInt(id, "product id");
}

function parseRelationId(id, fieldName) {
  return parsePositiveInt(id, fieldName);
}

function calculateFinalPrice(price, discount) {
  const final = price - (price * discount) / 100;
  return Math.round(final);
}

async function ensureProductRelationsExist({ category_id, type_id }) {
  const [category, type] = await Promise.all([
    category_id !== undefined ? findCategoryById(category_id) : null,
    type_id !== undefined ? findTypeById(type_id) : null,
  ]);

  const categoryNotFound = category_id !== undefined && !category;
  const typeNotFound = type_id !== undefined && !type;

  if (categoryNotFound && typeNotFound) {
    throw notFound("Category and type not found");
  }

  if (categoryNotFound) {
    throw notFound("Category not found");
  }

  if (typeNotFound) {
    throw notFound("Type not found");
  }
}

function validateProductPayload(payload, { isUpdate = false } = {}) {
  const {
    name,
    price,
    description,
    category_id,
    type_id,
    image_url,
    stock,
    discount_amount,
    is_active,
  } = payload;
  const data = {};

  if (!isUpdate) {
    const requiredFields = {
      name,
      price,
      description,
      category_id,
      type_id,
      image_url,
      stock,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (isEmptyValue(value)) {
        throw badRequest(`${key} is required`);
      }
    }
  }

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      throw badRequest("Name must be a non-empty string");
    }

    data.name = name;
  }

  if (description !== undefined) {
    if (!isNonEmptyString(description)) {
      throw badRequest("Description must be a non-empty string");
    }

    data.description = description;
  }

  if (category_id !== undefined) {
    data.category_id = parseRelationId(category_id, "category_id");
  }

  if (type_id !== undefined) {
    data.type_id = parseRelationId(type_id, "type_id");
  }

  if (image_url !== undefined) {
    if (!isLocalUploadPath(image_url, "/uploads/products")) {
      throw badRequest("Product image is required");
    }

    data.image_url = image_url;
  }

  if (price !== undefined) {
    data.price = parseNonNegativeNumber(price, "price");
  }

  if (stock !== undefined) {
    data.stock = parseNonNegativeInteger(stock, "stock");
  }

  if (!isEmptyValue(discount_amount)) {
    data.discount_amount = parseIntegerInRange(
      discount_amount,
      "discount_amount",
      0,
      100,
    );
  }

  const { cost } = payload;
  if (cost !== undefined) {
    data.cost = parseNonNegativeNumber(cost, "cost");
  }

  if (is_active !== undefined) {
    data.is_active = is_active === "true" || is_active === true;
  }

  return data;
}

export async function getAllProductsService(filters = {}) {
  const resolvedFilters = {
    is_active: true,
    ...filters,
  };
  const products = await getAllProducts(resolvedFilters);
  return products.map((product) => ({
    ...product,
    final_price: calculateFinalPrice(product.price, product.discount_amount),
  }));
}

export async function getAllProductsAdminService() {
  const products = await getAllProducts();
  return products.map((product) => ({
    ...product,
    final_price: calculateFinalPrice(product.price, product.discount_amount),
  }));
}

export async function getProductByIdService(id) {
  const parsedId = parseProductId(id);
  const existing = await findProductById(parsedId);

  if (!existing) {
    throw notFound("Product not found");
  }

  const final_price = calculateFinalPrice(
    existing.price,
    existing.discount_amount,
  );
  return { ...existing, final_price };
}

export async function createProductService(payload) {
  const data = validateProductPayload(payload, { isUpdate: false });

  await ensureProductRelationsExist({
    category_id: data.category_id,
    type_id: data.type_id,
  });

  const result = await createProduct({
    ...data,
    discount_amount: data.discount_amount ?? 0,
  });
  const final_price = calculateFinalPrice(result.price, result.discount_amount);

  return { ...result, final_price };
}

export async function updateProductService(id, payload) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw notFound("Product not found");
  }

  const data = validateProductPayload(payload, { isUpdate: true });

  await ensureProductRelationsExist(data);

  const result = await updateProduct(parsedId, data);

  if (data.image_url !== undefined && data.image_url !== existing.image_url) {
    await deletelocalUploadFile(existing.image_url);
  }

  if (data.stock !== undefined) {
    const threshold = Number(process.env.LOW_STOCK_THRESHOLD) || 10;
    findLowStockProducts(threshold)
      .then((products) => {
        if (products.length > 0) {
          sendLowStockAlertEmail({ products });
        }
      })
      .catch((err) => {
        console.error("[LowStock] Gagal mengecek stok produk:", err.message);
      });
  }

  const final_price = calculateFinalPrice(result.price, result.discount_amount);

  return { ...result, final_price };
}

export async function toggleProductStatusService(id) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw notFound("Product not found");
  }

  const newStatus = !existing.is_active;
  const result = await updateProduct(parsedId, { is_active: newStatus });

  const final_price = calculateFinalPrice(result.price, result.discount_amount);
  return { ...result, final_price };
}

export async function deleteProductService(id) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw notFound("Product not found");
  }

  const deleted = await deleteProduct(parsedId);

  await deletelocalUploadFile(existing.image_url);

  return deleted;
}
