"use server";
import { backend_url } from "@/utils/constants";
import { Ticker, tickerSchema } from "@/utils/types";
import axios from "axios";
import z from "zod";

// Define schema for array of tickers
const tickerArraySchema = z.array(tickerSchema);

// Fetch a specific ticker by market symbol
export const getTicker = async (market: string): Promise<Ticker> => {
  const tickers = await getTickers();
  const ticker = tickers.find((t) => t.symbol === market);
  if (!ticker) {
    throw new Error(`No ticker found for market symbol: ${market}`);
  }
  return ticker;
};

// Fetch all tickers from the backend API
const getTickers = async (): Promise<Ticker[]> => {
  try {
    console.log("Fetching tickers from backend...");
    const response = await axios.get(`${backend_url}/tickers`);
    console.log("Successfully fetched tickers");

    // Validate the response data using zod schema
    const result = tickerArraySchema.safeParse(response.data);
    if (result.success) {
      return result.data;
    } else {
      console.error("Schema validation error:", result.error.format());
      throw new Error("Failed to parse tickers data - Invalid data format");
    }
  } catch (error) {
    console.error("Error fetching tickers:", error);
    throw new Error(`Failed to fetch tickers: ${error || "Unknown error"}`);
  }
};
