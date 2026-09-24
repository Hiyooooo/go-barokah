import "dotenv/config";
import crypto from "node:crypto";
import { badRequest } from "./index.js";

const SNAP_SANDBOX_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const SNAP_PRODUCTION_URL = "https://app.midtrans.com/snap/v1/transactions";
const API_SANDBOX_URL = "https://api.sandbox.midtrans.com/v2";
const API_PRODUCTION_URL = "https://api.midtrans.com/v2";

export function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;

  if (!serverKey) {
    throw badRequest("MIDTRANS_SERVER_KEY is not configured");
  }

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapBaseUrl = isProduction ? SNAP_PRODUCTION_URL : SNAP_SANDBOX_URL;
  const apiBaseUrl = isProduction ? API_PRODUCTION_URL : API_SANDBOX_URL;

  return { serverKey, isProduction, snapBaseUrl, apiBaseUrl };
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

export async function chargeQrisDirect({ orderId, grossAmount }) {
  const { serverKey, apiBaseUrl } = getMidtransConfig();
  const base64Key = Buffer.from(serverKey + ":").toString("base64");
  const response = await fetch(`${apiBaseUrl}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${base64Key}`,
    },
    body: JSON.stringify({
      payment_type: "qris",
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(grossAmount),
      },
    }),
  });

  if (!response.ok) {
    let errorBody = {};
    try {
      errorBody = await response.json();
    } catch (_) {}
    throw new Error(
      `Midtrans API error [${response.status}]: ${
        errorBody.status_message ?? errorBody.error_messages?.join(", ") ?? "Unknown error"
      }`,
    );
  }

  const data = await response.json();
  const qrCodeUrl =
    data.actions?.find((a) => a.name === "generate-qr-code")?.url ?? null;
  return {
    qr_string: data.qr_string ?? null,
    qr_code_url: qrCodeUrl,
    expiry_time: data.expiry_time ? new Date(data.expiry_time) : null,
    transaction_id: data.transaction_id ?? null,
  };
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

export async function cancelMidtransTransaction(orderId) {
  const { serverKey, apiBaseUrl } = getMidtransConfig();
  const base64Key = Buffer.from(serverKey + ":").toString("base64");
  try {
    const response = await fetch(`${apiBaseUrl}/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${base64Key}`,
      },
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[Midtrans] cancelTransaction failed [${response.status}]: ${errBody}`);
      return false;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("[Midtrans] cancelTransaction network error:", error.message);
    return false;
  }
}
