import "dotenv/config";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { getRedisClient } from "../config/redis.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export function signToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function revokedTokenKey(token) {
    return `auth:revoked:${createHash("sha256").update(token).digest("hex")}`;
}

export async function revokeToken(token) {
    const decoded = jwt.decode(token);
    const expiresIn = decoded?.exp ? Math.max(1, decoded.exp - Math.floor(Date.now() / 1000)) : 86400;
    const redis = await getRedisClient();
    await redis.set(revokedTokenKey(token), "1", { EX: expiresIn });
}

export async function isTokenRevoked(token) {
    const redis = await getRedisClient();
    return (await redis.exists(revokedTokenKey(token))) === 1;
}
