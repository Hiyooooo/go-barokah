import { findCartByUserId } from "../repositories/cart.repository.js";
import {
  createCashSale,
  findCashSaleByNumberAndCashier,
} from "../repositories/cash-sale.repository.js";
import { badRequest, notFound, parsePositiveInt } from "../utils/index.js";

function saleNumber() {
  return `SALE-${new Date().toISOString().replace(/[-:.TZ]/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export async function createCashSaleService(cashierId, payload = {}) {
  const ids = Array.isArray(payload.cart_item_ids)
    ? payload.cart_item_ids.map((id) => parsePositiveInt(id, "cart_item_id"))
    : [];

  if (!ids.length)
    throw badRequest("cart_item_ids must contain at least one item");

  if (new Set(ids).size !== ids.length)
    throw badRequest("cart_item_ids must not contain duplicate items");

  const cashReceived = Number(payload.cash_received);

  if (!Number.isFinite(cashReceived) || cashReceived < 0)
    throw badRequest("cash_received must be a valid non-negative number");

  const cart = await findCartByUserId(cashierId);

  if (!cart) throw badRequest("Cart is empty");

  const selected = cart.items.filter((item) => ids.includes(item.id));

  if (selected.length !== new Set(ids).size)
    throw badRequest("One or more selected cart items were not found");

  const items = selected.map(({ product, quantity }) => {
    if (!product || !product.is_active)
      throw badRequest("Product is no longer available");

    if (quantity <= 0 || quantity > product.stock)
      throw badRequest(`${product.name} quantity exceeds product stock`);

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
  if (cashReceived < subtotal)
    throw badRequest("cash_received is less than the total");

  return createCashSale({
    cashierId,
    cartId: cart.id,
    itemIds: ids,
    saleNumber: saleNumber(),
    items,
    totals: {
      subtotal,
      discountTotal,
      grandTotal: subtotal,
      totalCost,
      grossProfit: subtotal - totalCost,
    },
    cashReceived,
    notes: payload.notes ? String(payload.notes).trim() : null,
  });
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

export async function getCashSaleService(cashierId, saleNumber) {
  const sale = await findCashSaleByNumberAndCashier(
    String(saleNumber),
    cashierId,
  );
  if (!sale) throw notFound("Cash sale not found");

  return {
    sale_number: sale.saleNumber,
    created_at: sale.createdAt,
    cashier: sale.cashier,
    payment_method: sale.paymentMethod,
    items: sale.items.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_amount: item.discountAmount,
      final_unit_price: item.finalUnitPrice,
      subtotal: item.subtotal,
    })),
    subtotal: sale.subtotal,
    discount_total: sale.discountTotal,
    grand_total: sale.grandTotal,
    cash_received: sale.cashReceived,
    change_amount: sale.changeAmount,
    notes: sale.notes,
  };
}
