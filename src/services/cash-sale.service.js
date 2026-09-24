import {
  findCartByUserId,
  findCartItemsByIds,
} from "../repositories/cart.repository.js";
import {
  cancelCashSaleAndRestoreStock,
  createCashSale,
  findCashSaleByIdempotencyKey,
  findCashSaleByNumber,
  findCashSaleByNumberAndCashier,
  findCashSalesByCashier,
} from "../repositories/cash-sale.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import { cancelMidtransTransaction, chargeQrisDirect, createSnapToken } from "../utils/midtrans.js";
import {
  badRequest,
  cashSaleError,
  notFound,
  parsePositiveInt,
} from "../utils/index.js";
import { createHash, randomUUID } from "node:crypto";

const CASH_SALE_STATUS = "COMPLETED";

function saleNumber() {
  return `SALE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildReceiptResponse(sale) {
  return {
    status: sale.status ?? CASH_SALE_STATUS,
    sale_number: sale.saleNumber,
    transaction_date: sale.createdAt,
    payment_method: sale.paymentMethod,
    subtotal: sale.subtotal,
    total_discount: sale.discountTotal,
    grand_total: sale.grandTotal,
    cash_received: sale.cashReceived,
    change_amount: sale.changeAmount,
    snap_token: sale.snapToken ?? null,
    payment_url: sale.paymentUrl ?? null,
    qr_string: sale.qrString ?? null,
    qr_code_url: sale.qrCodeUrl ?? null,
    expiry_time: sale.expiryTime ?? null,
    cashier: {
      id: sale.cashier.id,
      name: sale.cashier.name,
    },
    items: sale.items.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discountAmount,
      final_unit_price: item.finalUnitPrice,
      subtotal: item.subtotal,
    })),
    notes: sale.notes,
  };
}

function buildCashSaleResponse(sale) {
  return buildReceiptResponse(sale);
}

export async function createCashSaleService(
  cashierId,
  payload = {},
  idempotencyKey,
) {
  const normalizedKey = String(idempotencyKey ?? "").trim();
  if (!normalizedKey || normalizedKey.length > 100) {
    throw cashSaleError(
      "Idempotency-Key header is required and must be 100 characters or less",
      "INVALID_IDEMPOTENCY_KEY",
      null,
    );
  }

  const ids = Array.isArray(payload.cart_item_ids)
    ? payload.cart_item_ids.map((id) => parsePositiveInt(id, "cart_item_id"))
    : [];

  if (!ids.length) {
    throw cashSaleError("Cart is empty", "EMPTY_CART", null);
  }

  if (new Set(ids).size !== ids.length) {
    throw cashSaleError(
      "cart_item_ids must not contain duplicate items",
      "INVALID_CART_ITEMS",
      null,
    );
  }

  const rawPaymentMethod = payload.payment_method
    ? String(payload.payment_method).trim().toUpperCase()
    : "CASH";

  if (!["CASH", "QRIS", "VA"].includes(rawPaymentMethod)) {
    throw cashSaleError(
      "payment_method must be one of CASH, QRIS, or VA",
      "INVALID_PAYMENT_METHOD",
      null,
    );
  }

  const isCash = rawPaymentMethod === "CASH";

  let cashReceived = 0;
  if (isCash) {
    if (payload.cash_received === undefined || payload.cash_received === null || payload.cash_received === "") {
      throw cashSaleError(
        "cash_received is required for CASH payment method",
        "INVALID_CASH_RECEIVED",
        null,
      );
    }
    cashReceived = Number(payload.cash_received);
    if (!Number.isFinite(cashReceived) || cashReceived < 0) {
      throw cashSaleError(
        "cash_received must be a valid non-negative number",
        "INVALID_CASH_RECEIVED",
        null,
      );
    }
  } else {
    cashReceived = payload.cash_received !== undefined && payload.cash_received !== null && payload.cash_received !== ""
      ? Number(payload.cash_received)
      : 0;
    if (!Number.isFinite(cashReceived) || cashReceived < 0) {
      cashReceived = 0;
    }
  }

  const requestFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        cart_item_ids: ids,
        payment_method: rawPaymentMethod,
        cash_received: isCash ? cashReceived : 0,
        notes: payload.notes ? String(payload.notes).trim() : null,
      }),
    )
    .digest("hex");

  const previousSale = await findCashSaleByIdempotencyKey(normalizedKey);
  if (previousSale) {
    if (previousSale.cashierId !== cashierId) {
      throw cashSaleError(
        "Idempotency-Key is already in use",
        "INVALID_IDEMPOTENCY_KEY",
        null,
        409,
      );
    }
    if (previousSale.requestFingerprint !== requestFingerprint) {
      throw cashSaleError(
        "Idempotency-Key was already used with a different request",
        "IDEMPOTENCY_KEY_REUSED",
        null,
        409,
      );
    }
    return buildCashSaleResponse(previousSale);
  }

  const cart = await findCartByUserId(cashierId);

  if (!cart) throw cashSaleError("Cart is empty", "EMPTY_CART", null);

  const selected = cart.items.filter((item) => ids.includes(item.id));

  if (selected.length !== new Set(ids).size) {
    const existingItems = await findCartItemsByIds(ids);
    const existingIds = new Set(existingItems.map((item) => item.id));
    const foreignIds = ids.filter(
      (id) => existingIds.has(id) && !selected.some((item) => item.id === id),
    );

    if (foreignIds.length) {
      throw cashSaleError(
        "One or more cart items do not belong to the logged-in cashier.",
        "CART_ITEM_NOT_OWNED",
        { cart_item_ids: foreignIds },
      );
    }

    throw cashSaleError(
      "One or more cart items were not found",
      "CART_ITEM_NOT_FOUND",
      {
        cart_item_ids: ids.filter((id) => !existingIds.has(id)),
      },
    );
  }

  const items = selected.map(({ product, quantity }) => {
    if (!product || !product.is_active) {
      throw cashSaleError(
        "Product is no longer available",
        "PRODUCT_UNAVAILABLE",
        {
          product_id: product?.id ?? null,
          product_name: product?.name ?? null,
        },
      );
    }

    if (quantity <= 0 || quantity > product.stock) {
      throw cashSaleError(
        "Some products are no longer available in the requested quantity.",
        "INSUFFICIENT_STOCK",
        [
          {
            product_id: product.id,
            product_name: product.name,
            requested_quantity: quantity,
            available_quantity: product.stock,
          },
        ],
      );
    }

    const unitPrice = Number(product.price);
    const discountAmount = Number(product.discount_amount ?? 0);
    const finalUnitPrice = Math.round(
      unitPrice - (unitPrice * discountAmount) / 100,
    );

    const subtotal = finalUnitPrice * quantity;
    const totalCost = Number(product.cost ?? 0) * quantity;
    return {
      productId: product.id,
      productName: product.name,
      quantity,
      unitPrice,
      discountAmount,
      finalUnitPrice,
      subtotal,
      totalCost,
      grossProfit: subtotal - totalCost,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountTotal = items.reduce(
    (sum, item) => sum + (item.unitPrice - item.finalUnitPrice) * item.quantity,
    0,
  );
  const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
  if (isCash && cashReceived < subtotal) {
    throw cashSaleError(
      "Cash received is less than the transaction total.",
      "INSUFFICIENT_CASH",
      {
        grand_total: subtotal,
        cash_received: cashReceived,
        shortage_amount: subtotal - cashReceived,
      },
    );
  }

  const generatedSaleNumber = saleNumber();
  let snapToken = null;
  let paymentUrl = null;
  let midtransOrderId = null;
  let qrString = null;
  let qrCodeUrl = null;
  let expiryTime = null;
  const initialStatus = isCash ? "COMPLETED" : "PENDING";
  const initialCashReceived = isCash ? cashReceived : 0;
  const initialChangeAmount = isCash ? cashReceived - subtotal : 0;

  if (!isCash) {
    midtransOrderId = generatedSaleNumber;

    if (rawPaymentMethod === "QRIS") {
      try {
        const qrisResult = await chargeQrisDirect({
          orderId: midtransOrderId,
          grossAmount: subtotal,
        });
        qrString = qrisResult.qr_string;
        qrCodeUrl = qrisResult.qr_code_url;
        expiryTime = qrisResult.expiry_time;
      } catch (error) {
        console.error("[Midtrans QRIS CashSale] error:", error.message);
        throw cashSaleError(
          "Layanan pembayaran online sedang tidak tersedia, silakan coba beberapa saat lagi",
          "MIDTRANS_ERROR",
          { error: error.message },
          500,
        );
      }
    } else {
      const cashierUser = await findUserById(cashierId);
      const midtransPayload = {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: Math.round(subtotal),
        },
        customer_details: {
          first_name: cashierUser?.name || "Kasir",
          email: cashierUser?.email || "cashier@example.com",
          phone: cashierUser?.phoneNumber || "081234567890",
        },
        item_details: items.map((item) => ({
          id: String(item.productId),
          price: Math.round(item.finalUnitPrice),
          quantity: item.quantity,
          name: item.productName,
        })),
        enabled_payments: ["bca_va", "bni_va", "bri_va", "mandiri_bill", "permata_va", "other_va", "echannel"],
      };

      try {
        const snapResult = await createSnapToken(midtransPayload);
        snapToken = snapResult.token;
        paymentUrl = snapResult.redirect_url;
      } catch (error) {
        console.error("[Midtrans Snap CashSale] error:", error.message);
        throw cashSaleError(
          "Layanan pembayaran online sedang tidak tersedia, silakan coba beberapa saat lagi",
          "MIDTRANS_ERROR",
          { error: error.message },
          500,
        );
      }
    }
  }

  try {
    const sale = await createCashSale({
      cashierId,
      cartId: cart.id,
      itemIds: ids,
      saleNumber: generatedSaleNumber,
      items,
      totals: {
        subtotal,
        discountTotal,
        grandTotal: subtotal,
        totalCost,
        grossProfit: subtotal - totalCost,
      },
      paymentMethod: rawPaymentMethod,
      status: initialStatus,
      cashReceived: initialCashReceived,
      changeAmount: initialChangeAmount,
      snapToken,
      paymentUrl,
      midtransOrderId,
      qrString,
      qrCodeUrl,
      expiryTime,
      notes: payload.notes ? String(payload.notes).trim() : null,
      idempotencyKey: normalizedKey,
      requestFingerprint,
    });
    return buildCashSaleResponse(sale);
  } catch (error) {
    if (error.code === "P2002") {
      const existingSale = await findCashSaleByIdempotencyKey(normalizedKey);
      if (existingSale?.requestFingerprint === requestFingerprint)
        return buildCashSaleResponse(existingSale);
      if (existingSale) {
        throw cashSaleError(
          "Idempotency-Key was already used with a different request",
          "IDEMPOTENCY_KEY_REUSED",
          null,
          409,
        );
      }
    }
    if (error.message?.startsWith("Insufficient stock")) {
      throw cashSaleError(
        "Some products are no longer available in the requested quantity.",
        "INSUFFICIENT_STOCK",
        error.stockDetails ? [error.stockDetails] : null,
      );
    }
    if (error.statusCode) throw error;
    console.error("[CashSale] Transaction failed:", error);
    throw cashSaleError(
      "Cash sale could not be processed.",
      "CASH_SALE_FAILED",
      {
        error: error.message || "Unknown error",
        error_name: error.name || "Error",
        database_code: error.code || null,
      },
      500,
    );
  }
}

function parseHistoryDate(value, fieldName, endOfDay = false) {
  if (value === undefined) return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime()))
    throw badRequest(`${fieldName} must be a valid date`);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export async function getCashSalesService(cashierId, filters = {}, role = "cashier") {
  const page = parsePositiveInt(filters.page ?? 1, "page");
  const limit = parsePositiveInt(filters.limit ?? 20, "limit");
  if (limit > 50) throw badRequest("limit must be less than or equal to 50");

  const startDate = parseHistoryDate(filters.start_date, "start_date");
  const endDate = parseHistoryDate(filters.end_date, "end_date", true);
  if (startDate && endDate && startDate > endDate) {
    throw badRequest("start_date cannot be after end_date");
  }

  const isPrivileged = ["admin", "owner"].includes(
    String(role ?? "cashier").toLowerCase(),
  );

  const result = await findCashSalesByCashier(isPrivileged ? null : cashierId, {
    startDate,
    endDate,
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: result.sales.map((sale) => ({
      sale_number: sale.saleNumber,
      transaction_date: sale.createdAt,
      payment_method: String(sale.paymentMethod).toLowerCase(),
      grand_total: sale.grandTotal,
      status: sale.status,
      cashier: sale.cashier ?? null,
    })),
    meta: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
}

export async function getCashSaleReceiptService(cashierId, saleNumber) {
  const sale = await findCashSaleByNumberAndCashier(
    String(saleNumber),
    cashierId,
  );
  if (!sale) throw notFound("Cash sale not found");
  if (sale.status !== "COMPLETED") {
    throw badRequest("Struk hanya dapat dicetak setelah pembayaran selesai");
  }

  const rows = sale.items
    .map(
      (item) => `
    <tr><td>${escapeHtml(item.productName)}<br><small>${item.quantity} x ${formatMoney(item.finalUnitPrice)}</small></td><td>${formatMoney(item.subtotal)}</td></tr>
  `,
    )
    .join("");

  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><title>${escapeHtml(sale.saleNumber)}</title>
<style>body{font:14px Arial,sans-serif;max-width:360px;margin:24px auto;color:#111}h1{text-align:center;font-size:20px;margin:0 0 4px}.meta{text-align:center;color:#555;margin-bottom:18px}table{width:100%;border-collapse:collapse}td{padding:7px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right;white-space:nowrap}.summary{margin-top:12px}.summary div{display:flex;justify-content:space-between;padding:3px 0}.total{font-weight:700;border-top:2px solid #111;margin-top:6px;padding-top:8px!important}@media print{body{margin:0 auto}button{display:none}}</style></head>
<body><h1>Go Barokah</h1><div class="meta">Struk Penjualan<br>${escapeHtml(sale.saleNumber)}<br>${new Date(sale.createdAt).toLocaleString("id-ID")}<br>Kasir: ${escapeHtml(sale.cashier.name)}</div>
<table>${rows}</table><div class="summary"><div><span>Subtotal</span><span>${formatMoney(sale.subtotal)}</span></div><div><span>Diskon</span><span>${formatMoney(sale.discountTotal)}</span></div><div class="total"><span>Total</span><span>${formatMoney(sale.grandTotal)}</span></div><div><span>Tunai</span><span>${formatMoney(sale.cashReceived)}</span></div><div><span>Kembalian</span><span>${formatMoney(sale.changeAmount)}</span></div></div>
<p style="text-align:center;margin-top:24px">Terima kasih</p><button onclick="window.print()">Print</button></body></html>`;
}

export async function getCashSaleService(cashierId, saleNumber, role = "cashier") {
  const isPrivileged = ["admin", "owner"].includes(
    String(role ?? "cashier").toLowerCase(),
  );
  const sale = isPrivileged
    ? await findCashSaleByNumber(String(saleNumber))
    : await findCashSaleByNumberAndCashier(String(saleNumber), cashierId);
  if (!sale) throw notFound("Cash sale not found");

  return buildReceiptResponse(sale);
}

export async function cancelCashSaleService(cashierId, saleNumber) {
  const sale = await findCashSaleByNumberAndCashier(
    String(saleNumber),
    cashierId,
  );
  if (!sale) throw notFound("Cash sale not found");

  if (sale.status !== "PENDING") {
    throw badRequest(
      `Transaksi dengan status ${sale.status} tidak dapat dibatalkan`,
    );
  }

  if (sale.midtransOrderId) {
    await cancelMidtransTransaction(sale.midtransOrderId);
  }

  const cancelledSale = await cancelCashSaleAndRestoreStock(sale.id, "CANCELLED");
  return buildReceiptResponse(cancelledSale);
}

