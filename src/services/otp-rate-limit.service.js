import { getRedisClient } from "../config/redis.js";
import { serviceUnavailable, tooManyRequests } from "../utils/index.js";

const COOLDOWN_SECONDS = 60;
const WINDOW_SECONDS = 15 * 60;
const WINDOW_LIMIT = 5;
const DAILY_SECONDS = 24 * 60 * 60;
const DAILY_LIMIT = 10;
const RATE_LIMIT_SCRIPT = `
local cooldown = redis.call('SET', KEYS[1], '1', 'EX', ARGV[1], 'NX')
if not cooldown then
  local ttl = redis.call('TTL', KEYS[1])
  return {0, ttl}
end

local window_count = redis.call('INCR', KEYS[2])
if window_count == 1 then
  redis.call('EXPIRE', KEYS[2], ARGV[2])
end
if window_count > tonumber(ARGV[3]) then
  redis.call('DEL', KEYS[1])
  local ttl = redis.call('TTL', KEYS[2])
  return {-1, ttl}
end

local daily_count = redis.call('INCR', KEYS[3])
if daily_count == 1 then
  redis.call('EXPIRE', KEYS[3], ARGV[4])
end
if daily_count > tonumber(ARGV[5]) then
  redis.call('DEL', KEYS[1])
  local ttl = redis.call('TTL', KEYS[3])
  return {-1, ttl}
end

return {1, 0}
`;

function normalizeIdentifier(identifier) {
  return String(identifier).trim().toLowerCase();
}

function buildKeys(type, identifier) {
  const normalized = normalizeIdentifier(identifier);
  const prefix = `otp:rate:${type}:${normalized}`;

  return [`${prefix}:cooldown`, `${prefix}:window`, `${prefix}:daily`];
}

export async function consumeOtpRequestLimit(type, identifier) {
  const keys = buildKeys(type, identifier);

  let result;
  try {
    const redis = await getRedisClient();
    result = await redis.eval(RATE_LIMIT_SCRIPT, {
      keys,
      arguments: [
        String(COOLDOWN_SECONDS),
        String(WINDOW_SECONDS),
        String(WINDOW_LIMIT),
        String(DAILY_SECONDS),
        String(DAILY_LIMIT),
      ],
    });
  } catch (error) {
    console.error("[OTP] Redis rate limiter unavailable:", error.message);
    throw serviceUnavailable("OTP service is temporarily unavailable");
  }

  const [allowed, retryAfter] = result;
  if (allowed === 0 || allowed === -1) {
    const retryAfterSeconds = Math.max(Number(retryAfter) || 1, 1);
    throw tooManyRequests("Please wait before requesting another OTP", {
      details: { retry_after_seconds: retryAfterSeconds },
    });
  }
}
