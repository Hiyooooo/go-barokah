import prisma from "../config/prisma.js";

export async function findCartByUserId(userId) {
  return await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createCart(userId) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan");
  }

  const cart = await prisma.cart.create({
    data: {
      userId,
    },
  });

  return cart;
}

export async function findCartItem(cartId, productId) {
  return await prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
  });
}

export async function createCartItem(data) {
  return await prisma.cartItem.create({
    data: {
      cartId: data.cartId,
      productId: data.productId,
      quantity: data.quantity,
    },
  });
}

export async function updateCartItemQuantity(id, quantity) {
  return await prisma.cartItem.update({
    where: {
      id: id,
    },
    data: {
      quantity: quantity,
    },
  });
}

export async function deleteCartItem(id) {
  return await prisma.cartItem.delete({
    where: {
      id: id,
    },
  });
}

export async function clearCartItems(cartId) {
  return await prisma.cartItem.deleteMany({
    where: {
      cartId: cartId,
    },
  });
}
