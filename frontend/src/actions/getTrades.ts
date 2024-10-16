"use server";
import { BASE_URL } from "@/utils/constants";
import { tradeSchema, Trade } from "@/utils/types";
import axios from "axios";
import { z } from "zod";
const tradeArraySchema = z.array(tradeSchema);

export const getTrades = async (market: string): Promise<Trade[]> => {
  const response = await axios.get(`${BASE_URL}/trades?symbol=${market}`);
  const result = tradeArraySchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    console.error("Invalid data format:", result.error);
    throw new Error("Failed to parse trades data");
  }
};
