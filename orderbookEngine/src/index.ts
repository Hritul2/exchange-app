import { createClient } from "redis";

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");

  while (true) {
    const response = await redisClient.rPop("messages" as string);
    if (!response) {
    } else {
    }
  }
}
