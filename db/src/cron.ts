import { Client } from "pg";

const pgClient = new Client({
  user: String(process.env.POSTGRES_USER),
  host: String(process.env.POSTGRES_HOST),
  database: String(process.env.POSTGRES_DB),
  password: String(process.env.POSTGRES_PASSWORD),
  port: Number(process.env.POSTGRES_PORT),
});
pgClient.connect();

async function refreshViews() {
  await pgClient.query("REFRESH MATERIALIZED VIEW klines_1m");
  await pgClient.query("REFRESH MATERIALIZED VIEW klines_1h");
  await pgClient.query("REFRESH MATERIALIZED VIEW klines_1w");

  console.log("Materialized views refreshed successfully");
}

refreshViews().catch(console.error);

setInterval(() => {
  refreshViews();
}, 1000 * 10);
