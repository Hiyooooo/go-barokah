import {
  findUserById,
  findUserByPhone,
  getUserProfile,
  updateAccount,
} from "../repositories/user.repository.js";
import { badRequest, isValidPhone, notFound } from "../utils/index.js";

export async function getMyProfileService(userId) {
  const profile = await getUserProfile(userId);
  if (!profile) throw notFound("User not found");
  return profile;
}

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

  const existingAccount = await findUserById(userId);
  if (!existingAccount) {
    throw notFound("User not found");
  }

  const data = {
    userId,
    username,
    ...(phone_number && { phone_number }),
  };

  if (phone_number && phone_number !== existingAccount.phoneNumber) {
    data.phoneNumberVerified = false;
  }

  return await updateAccount(userId, data);
}
