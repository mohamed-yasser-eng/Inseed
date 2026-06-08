import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is required");
}

export const redis = new Redis(redisUrl, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
});


// export const redis = new Redis(redisUrl)




redis.on("connect", () => {
  console.log("Redis connection established");
});

redis.on("ready", () => {
  console.log("Redis client is ready");
});

redis.on("error", (error) => {
  console.error("Redis client error", error);
});

redis.on("close", () => {
  console.warn("Redis connection closed");
});

redis.on("reconnecting", () => {
  console.warn("Redis client reconnecting");
});


