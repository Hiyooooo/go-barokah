import { badRequest } from "./error.factory.js";

const FONNTE_API_URL = "https://api.fonnte.com/send";
const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

export async function sendWhatsappOtp({ target, message }) {
  if (!FONNTE_API_KEY) {
    throw badRequest("FONNTE_API_KEY is not configured");
  }

  const normalizedTarget = String(target)
    .replace(/\D/g, "")
    .replace(/^62(?=\d{9,})/, "0");

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
    throw badRequest(result.reason || "Failed to send OTP, please try again");
  }

  return result;
}
