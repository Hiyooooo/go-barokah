import "dotenv/config";
import crypto from "node:crypto";
import { badRequest } from "./index.js";

const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const SNAP_PRODUCTION_URL = "https://app.midtrans.com/snap/v1/transactions";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw badRequest("MIDTRANS_SERVER_KEY is not configured");
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapBaseUrl = isProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL;

  return { serverKey, isProduction, snapBaseUrl };
}

export async function createSnapToken(payload) {
  const { serverKey, snapBaseUrl } = getMidtransConfig();
  const base64Key = Buffer.from(serverKey + ":").toString("base64");
  const response = await fetch(snapBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64Key}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch (_) {}
    throw new Error(
      `Midtrans API error [${response.status}]: ${
        errorBody.error_messages?.join(", ") ?? "Unknown error"
      }`
    );
  }

  const data = await response.json();
  return { token: data.token, redirect_url: data.redirect_url };
}

export function verifyMidtransSignature(orderId, statusCode, grossAmount, receivedSignature) {
  const { serverKey } = getMidtransConfig();

  const rawString = orderId + statusCode + grossAmount + serverKey;
  const expectedHash = crypto.createHash("sha512").update(rawString).digest("hex");

  try {
    const a = Buffer.from(expectedHash);
    const b = Buffer.from(receivedSignature);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function isSnapTokenExpired(snapTokenCreatedAt, expiryHours = 24) {
  if (snapTokenCreatedAt === undefined || snapTokenCreatedAt === null) {
    return true;
  }

  const createdAt = new Date(snapTokenCreatedAt);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffHours = diffMs / (1000 * 60 * 60);

  return diffHours >= expiryHours;
}
