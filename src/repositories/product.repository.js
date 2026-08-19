import prisma from "../config/prisma.js";

const productRelations = {
  category: true,
  type: true,
};

export async function getAllProducts(filters = {}) {
  const { search, pagination } = filters;
  const where = search
    ? { name: { contains: String(search).trim() } }
    : {};

  if (!pagination) {
    return await prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
      include: productRelations,
    });
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { id: "asc" },
      skip: pagination.skip,
      take: pagination.limit,
      include: productRelations,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
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
      critical_stock: data.critical_stock ?? 10,
      min_order_quantity: data.min_order_quantity ?? 1,
      ...(data.is_active !== undefined && { is_active: data.is_active }),
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
      ...(data.critical_stock !== undefined && { critical_stock: data.critical_stock }),
      ...(data.min_order_quantity !== undefined && { min_order_quantity: data.min_order_quantity }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    },
    include: productRelations,
  });
}

export async function deleteProduct(id) {
  return await prisma.product.delete({
    where: { id: id },
  });
}


