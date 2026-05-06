import {
  findUserByPhone,
  updateAccount,
} from "../repositories/user.repository.js";
import { badRequest, isValidPhone } from "../utils/index.js";

export async function updateAccountService(userId, payload) {
  if (!payload.username || !payload.username.trim()) {
    throw badRequest("Username can't be empty");
  }
  const username = payload.username.trim();
  const phone_number = payload.phone_number ? payload.phone_number.trim() : "";

  if (username.length < 3 || username.length > 50) {
    throw badRequest("Username must be between 3 and 50 characters");
  }
  if (phone_number && !isValidPhone(phone_number)) {
    throw badRequest("Invalid phone number format");
  }

  if (phone_number) {
    const existingUser = await findUserByPhone(phone_number);
    if (existingUser && existingUser.id !== userId) {
      throw badRequest("Phone number already in use");
    }
  }

  const data = {
    userId,
    username,
    ...(phone_number && { phone_number }),
  };
  return await updateAccount(userId, data);
}
