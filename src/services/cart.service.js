import {
  clearCartItems,
  createCart,
  createCartItem,
  deleteCartItem,
  findCartByUserId,
  findCartItem,
  updateCartItemQuantity,
} from "../repositories/cart.repository.js";
import { findProductById } from "../repositories/product.repository.js";
import { badRequest, notFound, parsePositiveInt } from "../utils/index.js";

function notImplemented(todo) {
  throw new Error(`TODO: ${todo}`);
}

function calculateFinalPrice(price, discountAmount) {
  const finalPrice = price - (price * discountAmount) / 100;

  return Math.round(finalPrice);
}

function buildCartResponse(cart) {
  const items = (cart?.items ?? []).map((item) => {
    const product = item.product;
    const quantity = item.quantity;
    const price = Number(product.price);
    const discountAmount = Number(product.discount_amount ?? 0);
    const finalPrice = Math.round(price - (price * discountAmount) / 100);
    const normalSubtotal = price * quantity;
    const discountSubtotal = (price - finalPrice) * quantity;
    const subtotal = finalPrice * quantity;

    return {
      id: item.id,
      product_id: product.id,
      name: product.name,
      image_url: product.image_url,
      price,
      discount_amount: discountAmount,
      final_price: finalPrice,
      quantity,
      normal_subtotal: normalSubtotal,
      discount_subtotal: discountSubtotal,
      subtotal,
      stock: product.stock,
    };
  });

  const summary = items.reduce(
    (result, item) => ({
      items_count: result.items_count + 1,
      total_quantity: result.total_quantity + item.quantity,
      normal_subtotal: result.normal_subtotal + item.normal_subtotal,
      discount_total: result.discount_total + item.discount_subtotal,
      subtotal: result.subtotal + item.subtotal,
    }),
    {
      items_count: 0,
      total_quantity: 0,
      normal_subtotal: 0,
      discount_total: 0,
      subtotal: 0,
    },
  );

  return {
    id: cart?.id ?? null,
    user_id: cart?.userId ?? null,
    items,
    summary,
  };
}

function parseProductId(id) {
  return parsePositiveInt(id, "product_id");
}

function parseQuantity(quantity) {
  return parsePositiveInt(quantity, "quantity");
}

async function getOrCreateCart(userId) {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    return await createCart(userId);
  }

  return cart;
}

async function validateProductAndStock(productId, quantity) {
  const product = await findProductById(productId);
  if (!product) {
    throw notFound("Product not found");
  }

  if (!product.is_active) {
    throw badRequest("Product is no longer available");
  }

  if (product.stock <= 0) {
    throw badRequest("Product is out of stock");
  }

  if (quantity > product.stock) {
    throw badRequest("quantity exceeds product stock");
  }

  return product;
}

export async function getCartService(userId) {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    return buildCartResponse({
      id: null,
      userId,
      items: [],
    });
  }

  return buildCartResponse(cart);
}

export async function createCartItemService(userId, payload) {
  const productId = parseProductId(payload.product_id);
  const quantity = parseQuantity(payload.quantity ?? 1);

  const product = await validateProductAndStock(productId, quantity);

  const cart = await getOrCreateCart(userId);

  const existingItem = await findCartItem(cart.id, productId);

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (newQuantity > product.stock) {
      throw badRequest("Quantity exceeds product stock");
    }

    await updateCartItemQuantity(existingItem.id, newQuantity);
  } else {
    await createCartItem({
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  return getCartService(userId);
}
export async function updateCartItemService(userId, productId, payload) {
  const parsedProductId = parseProductId(productId);
  const quantity = parseQuantity(payload.quantity);

  const cart = await findCartByUserId(userId);
  if (!cart) {
    throw notFound("Cart not found");
  }

  const cartItem = await findCartItem(cart.id, parsedProductId);
  if (!cartItem) {
    throw notFound("Cart item not found");
  }

  const product = await validateProductAndStock(parsedProductId, quantity);

  if (quantity > product.stock) {
    throw badRequest("Quantity exceeds product stock");
  }

  await updateCartItemQuantity(cartItem.id, quantity);

  return getCartService(userId);
}

export async function deleteCartItemService(userId, productId) {
  const parsedProductId = parseProductId(productId);

  const cart = await findCartByUserId(userId);
  if (!cart) {
    throw notFound("Cart not found");
  }

  const cartItem = await findCartItem(cart.id, parsedProductId);
  if (!cartItem) {
    throw notFound("Cart item not found");
  }

  await deleteCartItem(cartItem.id);

  return getCartService(userId);
}

export async function clearCartService(userId) {
  const cart = await findCartByUserId(userId);
  if (!cart) {
    return buildCartResponse({
      id: null,
      userId,
      items: [],
    });
  }

  await clearCartItems(cart.id);

  return buildCartResponse({
    id: cart.id,
    userId,
    items: [],
  });
}
