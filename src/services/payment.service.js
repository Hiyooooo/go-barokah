import {
  findOrderByIdAndUserId,
  findOrderByMidtransOrderId,
  updateOrderPaymentToken,
  updateOrderPaymentStatus,
  updateOrderStatus,
  cancelOrderAndRestoreStock,
} from "../repositories/order.repository.js";
import {
  createSnapToken,
  verifyMidtransSignature,
  isSnapTokenExpired,
} from "../utils/midtrans.js";
import { badRequest, forbidden, notFound } from "../utils/index.js";
import { parsePositiveInt } from "../utils/index.js";

export async function initiatePaymentService(userId, orderId) {
  const parsedId = parsePositiveInt(orderId, "order id");

  const order = await findOrderByIdAndUserId(parsedId, userId);
  if (!order) {
    throw notFound("Order not found");
  }

  if (order.fulfillmentMethod === "PICKUP") {
    throw badRequest("Order dengan metode PICKUP tidak memerlukan pembayaran online");
  }

  if (order.status === "CANCELLED") {
    throw badRequest("Order sudah dibatalkan");
  }

  if (order.paymentStatus === "PAID") {
    throw badRequest("Order ini sudah dibayar");
  }

  if (order.paymentStatus === "FAILED") {
    throw badRequest("Status pembayaran gagal, silakan hubungi admin");
  }

  const tokenStillValid = order.snapToken && !isSnapTokenExpired(order.snapTokenCreatedAt);

  if (tokenStillValid) {
    return {
      snap_token: order.snapToken,
      payment_url: order.paymentUrl,
      order_number: order.orderNumber,
      grand_total: order.grandTotal,
    };
  }

  let midtransOrderId;
  if (!order.midtransOrderId) {
    midtransOrderId = order.orderNumber;
  } else {
    midtransOrderId = `${order.orderNumber}-${Date.now()}`;
  }

  const itemDetails = order.items.map((item) => ({
    id: String(item.productId),
    price: Math.round(item.finalUnitPrice),
    quantity: item.quantity,
    name: item.productName,
  }));

  if (order.shippingFee > 0) {
    itemDetails.push({
      id: "SHIPPING",
      price: Math.round(order.shippingFee),
      quantity: 1,
      name: "Biaya Pengiriman",
    });
  }

  const midtransPayload = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: Math.round(order.grandTotal),
    },
    customer_details: {
      first_name: order.user.name,
      email: order.user.email,
      phone: order.user.phoneNumber ?? order.recipientPhone,
    },
    item_details: itemDetails,
  };

  let token, redirect_url;
  try {
    const result = await createSnapToken(midtransPayload);
    token = result.token;
    redirect_url = result.redirect_url;
  } catch (error) {
    console.error("[Midtrans] createSnapToken error:", error.message);
    throw badRequest("Layanan pembayaran sedang tidak tersedia, silakan coba beberapa saat lagi");
  }

  await updateOrderPaymentToken(parsedId, {
    snapToken: token,
    paymentUrl: redirect_url,
    midtransOrderId,
    snapTokenCreatedAt: new Date(),
  });

  return {
    snap_token: token,
    payment_url: redirect_url,
    order_number: order.orderNumber,
    grand_total: order.grandTotal,
  };
}

export async function handleMidtransNotificationService(payload) {
  const {
    order_id,
    status_code,
    gross_amount,
    signature_key,
    transaction_status,
    fraud_status,
  } = payload;

  const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
  if (!isValid) {
    throw forbidden("Invalid Midtrans signature");
  }

  const order = await findOrderByMidtransOrderId(order_id);
  if (!order) {
    throw notFound("Order not found");
  }

  if (order.paymentStatus === "PAID") {
    return;
  }
  if (
    order.paymentStatus === "FAILED" &&
    ["expire", "deny", "cancel"].includes(transaction_status)
  ) {
    return;
  }

  if (
    transaction_status === "settlement" ||
    (transaction_status === "capture" && fraud_status === "accept")
  ) {
    await updateOrderPaymentStatus(order.id, {
      paymentStatus: "PAID",
      paidAt: new Date(),
    });
    await updateOrderStatus(order.id, { status: "PROCESSING" });
  }

  else if (
    transaction_status === "pending" ||
    (transaction_status === "capture" && fraud_status === "challenge")
  ) {
    console.log("[Midtrans] Transaction pending/challenge:", order_id);
  }
  else if (
    transaction_status === "deny" ||
    transaction_status === "expire" ||
    transaction_status === "cancel"
  ) {
    await cancelOrderAndRestoreStock(order.id);
    await updateOrderPaymentStatus(order.id, { paymentStatus: "FAILED" });
  }
}
