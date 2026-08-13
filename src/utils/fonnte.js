import { badRequest } from "./error.factory.js";

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

function normalizeTarget(target) {
  return String(target)
    .replace(/\D/g, "")
    .replace(/^62(?=\d{9,})/, "0");
}

export async function sendWhatsappMessage({ target, message }) {
  if (!FONNTE_API_KEY) {
    throw new Error("FONNTE_API_KEY is not configured");
  }

  const normalizedTarget = normalizeTarget(target);

  const response = await fetch(FONNTE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: FONNTE_API_KEY,
    },
    body: JSON.stringify({
      target: normalizedTarget,
      message,
      countryCode: "62",
    }),
  });

  const result = await response.json();

  if (!result.status) {
    throw new Error(result.reason || "Failed to send WhatsApp message");
  }

  return result;
}

export async function sendWhatsappOtp({ target, message }) {
  try {
    return await sendWhatsappMessage({ target, message });
  } catch (error) {
    throw badRequest(error.message || "Failed to send OTP, please try again");
  }
}
