import prisma from "../config/prisma.js";

const productRelations = {
  category: true,
  type: true,
};

export async function getAllProducts() {
  return await prisma.product.findMany({
    include: productRelations,
  });
}

export async function findProductById(id) {
  return await prisma.product.findUnique({
    where: { id: id },
    include: productRelations,
  });
}

export async function createProduct(data) {
  return await prisma.product.create({
    data: {
      name: data.name,
      price: data.price,
      cost: data.cost ?? 0,
      description: data.description,
      categoryId: data.category_id,
      typeId: data.type_id,
      image_url: data.image_url,
      stock: data.stock,
      discount_amount: data.discount_amount,
    },
    include: productRelations,
  });
}

export async function updateProduct(id, data) {
  return await prisma.product.update({
    where: { id: id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.cost !== undefined && { cost: data.cost }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category_id !== undefined && { categoryId: data.category_id }),
      ...(data.type_id !== undefined && { typeId: data.type_id }),
      ...(data.image_url !== undefined && { image_url: data.image_url }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.discount_amount !== undefined && {
        discount_amount: data.discount_amount,
      }),
    },
    include: productRelations,
  });
}

export async function deleteProduct(id) {
  return await prisma.product.delete({
    where: { id: id },
  });
}

export async function findLowStockProducts(threshold) {
  return await prisma.product.findMany({
    where: {
      stock: {
        lte: threshold,
      },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      category: {
        select: { name: true },
      },
    },
    orderBy: { stock: "asc" },
  });
}
