import {
  findUserByPhone,
  updateAccount,
} from "../repositories/user.repository.js";

function createBadRequestError(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

function isValidPhone(phone) {
  const regex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return regex.test(phone);
}

export async function updateAccountService(userId, payload) {
  if (!payload.username || !payload.username.trim()) {
    throw createBadRequestError("Username can't be empty");
  }
  const username = payload.username.trim();
  const phone_number = payload.phone_number ? payload.phone_number.trim() : "";

  if (username.length < 3 || username.length > 50) {
    throw createBadRequestError("Username must be between 3 and 50 characters");
  }
  if (phone_number && !isValidPhone(phone_number)) {
    throw createBadRequestError("Invalid phone number format");
  }

  if (phone_number) {
    const existingUser = await findUserByPhone(phone_number);
    if (existingUser && existingUser.id !== userId) {
      throw createBadRequestError("Phone number already in use");
    }
  }

  const data = {
    userId,
    username,
    ...(phone_number && { phone_number }),
  };
  return await updateAccount(userId, data);
}
