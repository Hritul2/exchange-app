"use server";
import { BASE_URL } from "@/utils/constants";
import { Ticker, tickerSchema } from "@/utils/types";
import axios from "axios";
import z from "zod";

const tickerArraySchema = z.array(tickerSchema);

export const getTicker = async (market: string): Promise<Ticker> => {
  const tickers = await getTickers();
  const ticker = tickers.find((t) => t.symbol === market);
  if (!ticker) {
    throw new Error(`No ticker found for ${market}`);
  }
  return ticker;
};

const getTickers = async (): Promise<Ticker[]> => {
  const response = await axios.get(`${BASE_URL}/tickers`);

  const result = tickerArraySchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    console.error("Invalid data format:", result.error);
    throw new Error("Failed to parse tickers data");
  }
};
