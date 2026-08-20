import prisma from "../config/prisma.js";

export async function getRevenueAggregation(startDate, endDate) {
  return await prisma.order.aggregate({
    where: {
      OR: [
        {
          paymentStatus: "PAID",
          paidAt: { gte: startDate, lte: endDate },
        },
        {
          fulfillmentMethod: "PICKUP",
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
        },
      ],
    },
    _sum: {
      grandTotal: true,
      itemsSubtotal: true,
      shippingFee: true,
      totalCost: true,
      grossProfit: true,
      discountTotal: true,
    },
    _count: { id: true },
  });
}

export async function getRevenuePerProduct(startDate, endDate) {
  return await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    where: {
      order: {
        OR: [
          {
            paymentStatus: "PAID",
            paidAt: { gte: startDate, lte: endDate },
          },
          {
            fulfillmentMethod: "PICKUP",
            status: "COMPLETED",
            completedAt: { gte: startDate, lte: endDate },
          },
        ],
      },
    },
    _sum: {
      quantity: true,
      subtotal: true,
      totalCost: true,
      grossProfit: true,
    },
    orderBy: { _sum: { subtotal: "desc" } },
  });
}
export async function getCashInflowAggregation(startDate, endDate) {
  return await prisma.order.aggregate({
    where: {
      OR: [
        {
          paymentStatus: "PAID",
          paidAt: { gte: startDate, lte: endDate },
        },
        {
          fulfillmentMethod: "PICKUP",
          status: "COMPLETED",
          completedAt: { gte: startDate, lte: endDate },
        },
      ],
    },
    _sum: {
      grandTotal: true,
      shippingFee: true,
    },
  });
}
