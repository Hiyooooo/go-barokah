import prisma from "../config/prisma.js";

export async function getAllType() {
  return await prisma.type.findMany();
}

export async function findTypeById(id) {
  return await prisma.type.findUnique({
    where: { id: id },
  });
}

export async function findTypeByName(name) {
  return await prisma.type.findUnique({
    where: { name: name },
  });
}

export async function createType(data) {
  return await prisma.type.create({
    data: {
      name: data.name,
    },
  });
}

export async function updateType(id, data) {
  return await prisma.type.update({
    where: { id: id },
    data: {
      name: data.name,
    },
  });
}
