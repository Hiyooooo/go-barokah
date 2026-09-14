import "dotenv/config";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const redisEnabled =
  String(process.env.REDIS_ENABLED ?? "false").trim().toLowerCase() === "true";

const redis = redisEnabled
  ? createClient({
      url: redisUrl,
      socket: { reconnectStrategy: false },
    })
  : null;

redis?.on("error", (error) => {
  console.error("[Redis] Client error:", error.message);
});

let connectPromise;

export async function getRedisClient() {
  if (!redis) return null;

  if (redis.isReady) {
    return redis;
  }

  connectPromise ??= redis.connect().catch((error) => {
    connectPromise = undefined;
    throw error;
  });

  await connectPromise;
  return redis;
}
