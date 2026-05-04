import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redis.on("error", (err) => console.error("[Redis] Error:", err));
redis.on("connect", () => console.log("[Redis] Connected"));

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
};

export const RedisKeys = {
  refreshToken: (userId: string) => `refresh_token:${userId}`,
  blacklist: (jti: string) => `blacklist:${jti}`,
};
