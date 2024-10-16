"use server";
import { BASE_URL } from "@/utils/constants";
import axios from "axios";

export const getMarkets = async (): Promise<string> => {
  const response = await axios.get(`${BASE_URL}/markets`);
  return response.data;
};
