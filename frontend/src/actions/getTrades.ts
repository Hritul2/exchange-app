"use server";
import { backend_url } from "@/utils/constants";
import { tradeSchema, Trade } from "@/utils/types";
import axios from "axios";
import { z } from "zod";
const tradeArraySchema = z.array(tradeSchema);

export const getTrades = async (market: string): Promise<Trade[]> => {
  const response = await axios.get(`${backend_url}/trades?symbol=${market}`);
  const result = tradeArraySchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    console.error("Invalid data format:", result.error);
    throw new Error("Failed to parse trades data");
  }
};
