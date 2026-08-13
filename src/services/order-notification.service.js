import { sendWhatsappMessage } from "../utils/fonnte.js";
import { sendOrderStatusEmail } from "../utils/mailer.js";

const NOTIFIABLE_STATUSES = new Set(["PROCESSING", "SHIPPED", "COMPLETED"]);

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function buildOrderStatusMessage(order, status) {
  const statusMessage =
    status === "PROCESSING"
      ? "sedang diproses dan disiapkan"
      : status === "SHIPPED"
        ? "telah dikirim"
        : "telah selesai";
  const items = order.items
    .map((item) => `- ${item.productName} x${item.quantity}`)
    .join("\n");
  const fulfillment =
    order.fulfillmentMethod === "PICKUP"
      ? "Metode: Pickup di toko"
      : `Alamat: ${order.shippingAddress}`;

  return `Halo ${order.user.name},

Pesanan Anda ${order.orderNumber} ${statusMessage}.

${items}

Total: ${formatRupiah(order.grandTotal)}
Status: ${status}
${fulfillment}

Terima kasih telah berbelanja di Go Barokah.`;
}

export async function notifyOrderStatusChanged(order, status) {
  if (!order || !NOTIFIABLE_STATUSES.has(status)) {
    return;
  }

  const message = buildOrderStatusMessage(order, status);
  const user = order.user;

  if (user.phoneNumber && user.phoneNumberVerified) {
    try {
      await sendWhatsappMessage({
        target: user.phoneNumber,
        message,
      });
      console.log(
        `[OrderNotification] WhatsApp sent for ${order.orderNumber} (${status})`,
      );
      return;
    } catch (error) {
      console.error(
        `[OrderNotification] WhatsApp failed for ${order.orderNumber}:`,
        error.message,
      );
    }
  }

  try {
    await sendOrderStatusEmail({
      to: user.email,
      order,
      status,
      message,
    });
    console.log(
      `[OrderNotification] Email sent for ${order.orderNumber} (${status})`,
    );
  } catch (error) {
    console.error(
      `[OrderNotification] Email failed for ${order.orderNumber}:`,
      error.message,
    );
  }
}
