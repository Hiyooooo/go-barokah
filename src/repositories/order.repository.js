import prisma from "../config/prisma.js";

const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phoneNumber: true,
    },
  },
  items: {
    orderBy: { id: "asc" },
  },
};

export async function createOrderFromCart({
  userId,
  cartId,
  address,
  fulfillmentMethod = "DELIVERY",
  pickupRecipient,
  orderNumber,
  items,
  totals,
  notes,
}) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        addressId: address?.id ?? null,
        orderNumber,
        fulfillmentMethod,
        status: "PENDING",
        paymentStatus: "UNPAID",
        recipientName: address?.recipientName ?? pickupRecipient.name,
        recipientPhone: address?.recipientPhone ?? pickupRecipient.phone,
        shippingAddress: address?.addressDetail ?? "Ambil sendiri di toko",
        normalSubtotal: totals.normalSubtotal,
        discountTotal: totals.discountTotal,
        itemsSubtotal: totals.itemsSubtotal,
        shippingFee: totals.shippingFee,
        grandTotal: totals.grandTotal,
        notes,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productImageUrl: item.productImageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            finalUnitPrice: item.finalUnitPrice,
            normalSubtotal: item.normalSubtotal,
            discountSubtotal: item.discountSubtotal,
            subtotal: item.subtotal,
            unitCost: item.unitCost ?? 0,
          })),
        },
      },
      include: orderInclude,
    });

    for (const item of items) {
      const updateResult = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: {
            gte: item.quantity,
          },
        },

        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updateResult.count !== 1) {
        throw new Error(`Insufficient stock for product ${item.productName}`);
      }
    }

    await tx.cartItem.deleteMany({
      where: {
        cartId,
      },
    });

    return order;
  });
}

export async function findOrderByUserId(userId, filters = {}) {
  const { status, payment_status, fulfillment_method, pagination } = filters;
  const where = {
    userId,
    ...(status && { status }),
    ...(payment_status && { paymentStatus: payment_status }),
    ...(fulfillment_method && { fulfillmentMethod: fulfillment_method }),
  };

  if (pagination) {
    const [orders, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: orderInclude,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  return await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
}

export async function findOrderByIdAndUserId(id, userId) {
  return await prisma.order.findFirst({
    where: {
      id,
      userId,
    },
    include: orderInclude,
  });
}

export async function findAllOrders(filters = {}) {
  const { status, payment_status } = filters;

  return await prisma.order.findMany({
    where: {
      ...(status && { status }),
      ...(payment_status && { paymentStatus: payment_status }),
    },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
}

export async function findOrderById(id) {
  return await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
}

export async function cancelOrderAndRestoreStock(id) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return null;
    }

    for (const item of order.items) {
      await tx.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return await tx.order.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      include: orderInclude,
    });
  });
}

export async function updateOrderStatus(id, data) {
  return await prisma.order.update({
    where: { id },
    data,
    include: orderInclude,
  });
}

export async function updateOrderPaymentStatus(id, data) {
  return await prisma.order.update({
    where: { id },
    data,
    include: orderInclude,
  });
}
