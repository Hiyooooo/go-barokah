import prisma from "../config/prisma.js";

const include = { items: { orderBy: { id: "asc" } } };

export async function createCashSale({
  cashierId,
  cartId,
  itemIds,
  saleNumber,
  items,
  totals,
  cashReceived,
  notes,
}) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.cashSale.create({
      data: {
        cashierId,
        saleNumber,
        paymentMethod: "CASH",
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        grandTotal: totals.grandTotal,
        cashReceived,
        changeAmount: cashReceived - totals.grandTotal,
        totalCost: totals.totalCost,
        grossProfit: totals.grossProfit,
        notes,
        items: { create: items },
      },
      include,
    });

    for (const item of items) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count !== 1)
        throw new Error(`Insufficient stock for product ${item.productName}`);
    }

    await tx.cartItem.deleteMany({ where: { cartId, id: { in: itemIds } } });
    return sale;
  });
}

export async function getCashSaleAggregation(startDate, endDate) {
  return prisma.cashSale.aggregate({
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: {
      grandTotal: true,
      subtotal: true,
      discountTotal: true,
      totalCost: true,
      grossProfit: true,
    },
    _count: { id: true },
  });
}

export async function getCashSalePerProduct(startDate, endDate) {
  return prisma.cashSaleItem.groupBy({
    by: ["productId", "productName"],
    where: { cashSale: { createdAt: { gte: startDate, lte: endDate } } },
    _sum: {
      quantity: true,
      subtotal: true,
      totalCost: true,
      grossProfit: true,
    },
    orderBy: { _sum: { subtotal: "desc" } },
  });
}

export async function findCashSaleByNumberAndCashier(saleNumber, cashierId) {
  return prisma.cashSale.findFirst({
    where: { saleNumber, cashierId },
    include: {
      cashier: { select: { name: true } },
      items: { orderBy: { id: "asc" } },
    },
  });
}
