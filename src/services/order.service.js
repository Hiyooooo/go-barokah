import { findAddressById } from "../repositories/address.repository.js";
import { findCartByUserId } from "../repositories/cart.repository.js";
import {
  cancelOrderAndRestoreStock,
  createOrderFromCart,
  findAllOrders,
  findOrderById,
  findOrderByIdAndUserId,
  findOrderByUserId,
  updateOrderPaymentStatus,
  updateOrderStatus,
} from "../repositories/order.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import { badRequest, notFound, parsePositiveInt } from "../utils/index.js";

const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];

const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"];

const ORDER_STATUS_TRANSITIONS = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

const PAYMENT_STATUS_TRANSITIONS = {
  UNPAID: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: [],
  REFUNDED: [],
};

function calculateFinalUnitPrice(price, discountAmount) {
  const finalPrice = price - (price * discountAmount) / 100;

  return Math.round(finalPrice);
}

function calculateDummyShippingFee({ itemsSubtotal }) {
  if (itemsSubtotal >= 200000) {
    return 0;
  }

  return 10000;
}

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replaceAll("-", "");
  const timeStampPart = Date.now();
  const randomPart = Math.floor(Math.random() * 9000) + 1000;

  return `ORD-${datePart}-${timeStampPart}-${randomPart}`;
}

function normalizeOptionNotes(notes) {
  if (notes === undefined || notes === null) {
    return null;
  }

  const normalized = String(notes).trim();
  return normalized || null;
}

function normalizeStatus(value, fieldName) {
  if (!value) {
    throw badRequest(`${fieldName} is required`);
  }

  return String(value).trim().toUpperCase();
}

function buildCheckoutItems(cartItems) {
  return cartItems.map((cartItem) => {
    const product = cartItem.product;

    if (!product) {
      throw badRequest("Product is no longer available");
    }

    if (cartItem.quantity <= 0) {
      throw badRequest("Product quantity must be greater than 0");
    }

    if (product.stock <= 0) {
      throw badRequest(`${product.name} is out of stock`);
    }

    if (cartItem.quantity > product.stock) {
      throw badRequest(`${product.name} quantity exceeds product stock`);
    }

    const unitPrice = Number(product.price);
    const discountAmount = Number(product.discount_amount ?? 0);
    const finalUnitPrice = calculateFinalUnitPrice(unitPrice, discountAmount);
    const quantity = cartItem.quantity;
    const normalSubtotal = unitPrice * quantity;
    const subtotal = finalUnitPrice * quantity;
    const discountSubtotal = normalSubtotal - subtotal;

    return {
      productId: product.id,
      productName: product.name,
      productImageUrl: product.image_url,
      quantity,
      unitPrice,
      discountAmount,
      finalUnitPrice,
      normalSubtotal,
      discountSubtotal,
      subtotal,
    };
  });
}

function buildCheckoutTotals(items, options = {}) {
  const baseTotals = items.reduce(
    (result, item) => ({
      normalSubtotal: result.normalSubtotal + item.normalSubtotal,
      discountTotal: result.discountTotal + item.discountSubtotal,
      itemsSubtotal: result.itemsSubtotal + item.subtotal,
      totalQuantity: result.totalQuantity + item.quantity,
    }),
    {
      normalSubtotal: 0,
      discountTotal: 0,
      itemsSubtotal: 0,
      totalQuantity: 0,
    },
  );

  const shippingFee =
    options.fulfillmentMethod === "PICKUP"
      ? 0
      : calculateDummyShippingFee({
          itemsSubtotal: baseTotals.itemsSubtotal,
          totalQuantity: baseTotals.totalQuantity,
        });

  return {
    ...baseTotals,
    shippingFee,
    grandTotal: baseTotals.itemsSubtotal + shippingFee,
  };
}

function assertValidOrderStatus(status) {
  if (!ORDER_STATUSES.includes(status)) {
    throw badRequest("Invalid order status");
  }
}

function assertValidPaymentStatus(paymentStatus) {
  if (!PAYMENT_STATUSES.includes(paymentStatus)) {
    throw badRequest("Invalid payment status");
  }
}

function assertValidOrderTransition(currentStatus, nextStatus) {
  const allowedStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw badRequest(
      `Cannot change order status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

function assertValidPaymentTransition(currentStatus, nextStatus) {
  const allowedStatuses = PAYMENT_STATUS_TRANSITIONS[currentStatus] ?? [];

  if (!allowedStatuses.includes(nextStatus)) {
    throw badRequest(
      `Cannot change payment status from ${currentStatus} to ${nextStatus}`,
    );
  }
}

export async function createOrderService(userId, payload = {}) {
  const addressId = parsePositiveInt(payload.address_id, "address_id");
  const notes = normalizeOptionNotes(payload.notes);

  const cart = await findCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw badRequest("Cart is empty");
  }

  const address = await findAddressById(addressId, userId);
  if (!address) {
    throw notFound("Address not found");
  }

  const items = buildCheckoutItems(cart.items);
  const totals = buildCheckoutTotals(items);
  const orderNumber = generateOrderNumber();

  try {
    return await createOrderFromCart({
      userId,
      cartId: cart.id,
      address,
      fulfillmentMethod: "DELIVERY",
      orderNumber,
      items,
      totals,
      notes,
    });
  } catch (error) {
    if (error.message?.startsWith("Insufficient stock")) {
      throw badRequest(error.message);
    }

    throw error;
  }
}

export async function createPickupOrderService(userId, payload = {}) {
  const notes = normalizeOptionNotes(payload.notes);

  const user = await findUserById(userId);
  if (!user) {
    throw notFound("User not found");
  }

  if (!user.phoneNumber) {
    throw badRequest("Phone number is required for pickup order");
  }

  const cart = await findCartByUserId(userId);
  if (!cart || cart.items.length === 0) {
    throw badRequest("Cart is empty");
  }

  const items = buildCheckoutItems(cart.items);
  const totals = buildCheckoutTotals(items, {
    fulfillmentMethod: "PICKUP",
  });
  const orderNumber = generateOrderNumber();

  try {
    return await createOrderFromCart({
      userId,
      cartId: cart.id,
      fulfillmentMethod: "PICKUP",
      pickupRecipient: {
        name: user.name,
        phone: user.phoneNumber,
      },
      orderNumber,
      items,
      totals,
      notes,
    });
  } catch (error) {
    if (error.message?.startsWith("Insufficient stock")) {
      throw badRequest(error.message);
    }

    throw error;
  }
}

export async function getMyOrdersService(userId, filters = {}) {
  return await findOrderByUserId(userId, {
    status: filters.status ? String(filters.status).toUpperCase() : undefined,
    payment_status: filters.payment_status
      ? String(filters.payment_status).toUpperCase()
      : undefined,
  });
}

export async function getMyOrderByIdService(userId, id) {
  const parsedId = parsePositiveInt(id, "order id");
  const order = await findOrderByIdAndUserId(parsedId, userId);

  if (!order) {
    throw notFound("Order not found");
  }

  return order;
}

export async function cancelMyOrderService(userId, id) {
  const parsedId = parsePositiveInt(id, "order id");
  const order = await findOrderByIdAndUserId(parsedId, userId);

  if (!order) {
    throw notFound("Order not found");
  }

  if (order.status !== "PENDING") {
    throw badRequest("Only pending order can be cancelled");
  }

  if (order.paymentStatus !== "UNPAID") {
    throw badRequest("Paid order cannot be cancelled by user");
  }

  return await cancelOrderAndRestoreStock(parsedId);
}

export async function getAllOrdersService(filters = {}) {
  return await findAllOrders({
    status: filters.status ? String(filters.status).toUpperCase() : undefined,
    payment_status: filters.payment_status
      ? String(filters.payment_status).toUpperCase()
      : undefined,
  });
}

export async function getOrderByIdForAdminService(id) {
  const parsedId = parsePositiveInt(id, "order id");
  const order = await findOrderById(parsedId);

  if (!order) {
    throw notFound("Order not found");
  }

  return order;
}

export async function updateOrderStatusService(id, payload) {
  const parsedId = parsePositiveInt(id, "order id");
  const nextStatus = normalizeStatus(payload.status, "status");

  assertValidOrderStatus(nextStatus);

  const order = await findOrderById(parsedId);
  if (!order) {
    throw notFound("Order not found");
  }

  assertValidOrderTransition(order.status, nextStatus);

  if (nextStatus === "CANCELLED") {
    if (order.paymentStatus === "PAID") {
      throw badRequest("Paid order cannot be cancelled");
    }

    return await cancelOrderAndRestoreStock(parsedId);
  }

  const data = {
    status: nextStatus,
    ...(nextStatus === "COMPLETED" && { completedAt: new Date() }),
  };

  return await updateOrderStatus(parsedId, data);
}

export async function updatePaymentStatusService(id, payload) {
  const parsedId = parsePositiveInt(id, "order id");
  const nextPaymentStatus = normalizeStatus(
    payload.payment_status,
    "payment_status",
  );

  assertValidPaymentStatus(nextPaymentStatus);

  const order = await findOrderById(parsedId);
  if (!order) {
    throw notFound("Order not found");
  }

  if (order.status === "CANCELLED") {
    throw badRequest("Cancelled order payment status cannot be updated");
  }

  assertValidPaymentTransition(order.paymentStatus, nextPaymentStatus);

  const data = {
    paymentStatus: nextPaymentStatus,
    ...(nextPaymentStatus === "PAID" && { paidAt: new Date() }),
  };

  return await updateOrderPaymentStatus(parsedId, data);
}
