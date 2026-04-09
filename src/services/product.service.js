import {
  createProduct,
  deleteProduct,
  findProductById,
  getAllProducts,
  updateProduct,
} from "../repositories/product.repository.js";

function createBadRequestError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function createNotFoundError() {
  const err = new Error("Product not found");
  err.statusCode = 404;
  return err;
}

function parseProductId(id) {
  const parsed = Number(id);
  if (Number.isNaN(parsed)) {
    throw createBadRequestError("Invalid product id");
  }
  return parsed;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}

function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function calculateFinalPrice(price, discount) {
  const final = price - (price * discount) / 100;
  return Math.round(final);
}

function validateProductPayload(payload, { isUpdate = false } = {}) {
  const { name, price, description, image_url, stock, discount_amount } =
    payload;

  if (!isUpdate) {
    const requiredFields = { name, price, description, image_url, stock };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (value === undefined) {
        throw createBadRequestError(`${key} is required`);
      }
    }
  }

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      throw createBadRequestError("Name must be a non-empty string");
    }
  }

  if (description !== undefined) {
    if (!isNonEmptyString(description)) {
      throw createBadRequestError("Description must be a non-empty string");
    }
  }

  if (image_url !== undefined) {
    if (!isNonEmptyString(image_url) || !validateURL(image_url)) {
      throw createBadRequestError("Invalid image URL");
    }
  }

  if (price !== undefined) {
    if (!isValidNumber(price) || price < 0) {
      throw createBadRequestError("Price must be a number >= 0");
    }
  }

  if (stock !== undefined) {
    if (!isValidNumber(stock) || stock < 0) {
      throw createBadRequestError("Stock must be a number >= 0");
    }
  }

  if (discount_amount !== undefined) {
    if (!isValidNumber(discount_amount) || discount_amount < 0) {
      throw createBadRequestError("Discount must be a number >= 0");
    }
  }

  if (discount_amount !== undefined) {
    if (
      !isValidNumber(discount_amount) ||
      discount_amount < 0 ||
      discount_amount > 100
    ) {
      throw createBadRequestError(
        "Discount must be a number between 0 and 100",
      );
    }
  }
}

export async function getAllProductsService() {
  return await getAllProducts();
}

export async function getProductByIdService(id) {
  const parsedId = parseProductId(id);
  const existing = await findProductById(parsedId);

  if (!existing) {
    throw createNotFoundError();
  }

  return existing;
}

export async function createProductService(payload) {
  validateProductPayload(payload, { isUpdate: false });

  const { name, price, description, image_url, stock, discount_amount } =
    payload;

  const data = {
    name,
    price,
    description,
    image_url,
    stock,
    discount_amount: discount_amount ?? 0,
  };

  return await createProduct(data);
}

export async function updateProductService(id, payload) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw createNotFoundError();
  }

  validateProductPayload(payload, { isUpdate: true });

  const { name, price, description, image_url, stock, discount_amount } =
    payload;

  const data = {
    ...(name !== undefined && { name }),
    ...(price !== undefined && { price }),
    ...(description !== undefined && { description }),
    ...(image_url !== undefined && { image_url }),
    ...(stock !== undefined && { stock }),
    ...(discount_amount !== undefined && { discount_amount }),
  };

  return await updateProduct(parsedId, data);
}

export async function deleteProductService(id) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw createNotFoundError();
  }

  return await deleteProduct(parsedId);
}
