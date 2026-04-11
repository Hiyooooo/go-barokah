import prisma from "../config/prisma.js";

export async function getAllProducts() {
  return await prisma.product.findMany();
}

export async function findProductById(id) {
  return await prisma.product.findUnique({
    where: { id: id },
  });
}

export async function createProduct(data) {
  return await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      description: data.description,
      image_url: data.image_url,
      stock: data.stock,
      discount_amount: data.discount_amount,
    },
  });
}

export async function updateProduct(id, data) {
  return await prisma.product.update({
    where: { id: id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.discount_amount !== undefined && {
        discount_amount: data.discount_amount,
      }),
    },
  });
}

export async function deleteProduct(id) {
  return await prisma.product.delete({
    where: { id: id },
  });
}
