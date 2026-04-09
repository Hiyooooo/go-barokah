import prisma from "../config/prisma.js";

export async function getAllProducts() {
  // TODO: ambil semua product (opsional: pagination, sorting)
  return await prisma.product.findMany();
}

export async function findProductById(id) {
  // TODO: ambil product by id
  return await prisma.product.findUnique({
    where: { id: id },
  });
}

export async function createProduct(data) {
  // TODO: create product sesuai field schema (name, price, description, image_url, stock, discount_amount)
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
  // TODO: update product by id (partial update)
  return await prisma.product.update({
    where: { id: id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.price && { price: data.price }),
      ...(data.description && { description: data.description }),
      ...(data.image_url && { image_url: data.image_url }),
      ...(data.stock && { stock: data.stock }),
      ...(data.discount_amount && { discount_amount: data.discount_amount }),
    },
  });
}

export async function deleteProduct(id) {
  // TODO: delete product by id
  return await prisma.product.delete({
    where: { id: id },
  });
}
