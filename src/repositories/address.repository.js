import prisma from "../config/prisma.js";

export async function getAllAddress(userId) {
  return await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function findAddressById(id, userId) {
  return await prisma.address.findFirst({
    where: { id, userId },
  });
}

export async function createAddress(data) {
  return await prisma.$transaction(async (tx) => {
    if (data.is_default) {
      await tx.address.updateMany({
        where: { userId: data.userId },
        data: { isDefault: false },
      });
    }

    return await tx.address.create({
      data: {
        userId: data.userId,
        label: data.label,
        recipientName: data.recipient_name,
        recipientPhone: data.recipient_phone,
        addressDetail: data.address_detail,
        ...(data.courier_note !== undefined && {
          courierNote: data.courier_note,
        }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        isDefault: data.is_default ?? false,
      },
    });
  });
}

export async function updateAddress(id, userId, data) {
  return await prisma.$transaction(async (tx) => {
    if (data.is_default) {
      await tx.address.updateMany({
        where: {
          userId,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return await tx.address.update({
      where: { id },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.recipient_name !== undefined && {
          recipientName: data.recipient_name,
        }),
        ...(data.recipient_phone !== undefined && {
          recipientPhone: data.recipient_phone,
        }),
        ...(data.address_detail !== undefined && {
          addressDetail: data.address_detail,
        }),
        ...(data.courier_note !== undefined && {
          courierNote: data.courier_note,
        }),
        ...(data.latitude !== undefined && {
          latitude: data.latitude,
        }),
        ...(data.longitude !== undefined && {
          longitude: data.longitude,
        }),
        ...(data.is_default !== undefined && { isDefault: data.is_default }),
      },
    });
  });
}

export async function deleteAddress(id) {
  return await prisma.address.delete({
    where: { id },
  });
}
