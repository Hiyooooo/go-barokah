import prisma from "../config/prisma.js";

export async function getAllCategory() {
  return await prisma.category.findMany();
}

export async function findCategoryById(id) {
  return await prisma.category.findUnique({
    where: { id: id },
  });
}

export async function findCategoryByName(name) {
  return await prisma.category.findUnique({
    where: { name: name },
  });
}

export async function createCategory(data) {
  return await prisma.category.create({
    data: {
      name: data.name,
    },
  });
}

export async function updateCategory(id, data) {
  return await prisma.category.update({
    where: { id: id },
    data: {
      name: data.name,
    },
  });
}

export async function deleteCategory(id) {
  return await prisma.category.delete({
    where: { id: id },
  });
}
