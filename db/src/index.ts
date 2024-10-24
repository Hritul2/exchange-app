import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./lib/types";

const pgClient = new Client({
  user: String(process.env.POSTGRES_USER),
  host: String(process.env.POSTGRES_HOST),
  database: String(process.env.POSTGRES_DB),
  password: String(process.env.POSTGRES_PASSWORD),
  port: Number(process.env.POSTGRES_PORT),
});
pgClient.connect();

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");
  while (true) {
    const response = await redisClient.rPop("db_processor" as string);
    if (!response) {
    } else {
      const data: DbMessage = JSON.parse(response);
      if (data.type === "TRADE_ADDED") {
        console.log("adding data");
        console.log(data);
        const price = data.data.price;
        const timestamp = new Date(data.data.timestamp);
        const query = "INSERT INTO tata_prices (time, price) VALUES ($1, $2)";
        // TODO: How to add volume?
        const values = [timestamp, price];
        await pgClient.query(query, values);
      }
    }
  }
}

main();
