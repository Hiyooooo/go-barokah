import {
  createProduct,
  deleteProduct,
  findProductById,
  getAllProducts,
  updateProduct,
} from "../repositories/product.repository.js";
import {
  badRequest,
  isNonEmptyString,
  isValidNumber,
  isValidUrl,
  notFound,
  parsePositiveInt,
} from "../utils/index.js";

function parseProductId(id) {
  return parsePositiveInt(id, "product id");
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
        throw badRequest(`${key} is required`);
      }
    }
  }

  if (name !== undefined) {
    if (!isNonEmptyString(name)) {
      throw badRequest("Name must be a non-empty string");
    }
  }

  if (description !== undefined) {
    if (!isNonEmptyString(description)) {
      throw badRequest("Description must be a non-empty string");
    }
  }

  if (image_url !== undefined) {
    if (!isNonEmptyString(image_url) || !isValidUrl(image_url)) {
      throw badRequest("Invalid image URL");
    }
  }

  if (price !== undefined) {
    if (!isValidNumber(price) || price < 0) {
      throw badRequest("Price must be a number >= 0");
    }
  }

  if (stock !== undefined) {
    if (!isValidNumber(stock) || stock < 0) {
      throw badRequest("Stock must be a number >= 0");
    }
  }

  if (discount_amount !== undefined) {
    if (!isValidNumber(discount_amount) || discount_amount < 0) {
      throw badRequest("Discount must be a number >= 0");
    }
  }

  if (discount_amount !== undefined) {
    if (
      !isValidNumber(discount_amount) ||
      discount_amount < 0 ||
      discount_amount > 100
    ) {
      throw badRequest("Discount must be a number between 0 and 100");
    }
  }
}

export async function getAllProductsService() {
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

  const result = await createProduct(data);
  const final_price = calculateFinalPrice(result.price, result.discount_amount);

  return { ...result, final_price };
}

export async function updateProductService(id, payload) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw notFound("Product not found");
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

  const result = await updateProduct(parsedId, data);
  const final_price = calculateFinalPrice(result.price, result.discount_amount);

  return { ...result, final_price };
}

export async function deleteProductService(id) {
  const parsedId = parseProductId(id);

  const existing = await findProductById(parsedId);
  if (!existing) {
    throw notFound("Product not found");
  }

  return await deleteProduct(parsedId);
}
