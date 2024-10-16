"use server";
import { backend_url } from "@/utils/constants";
import axios from "axios";

export const getMarkets = async (): Promise<string> => {
  const response = await axios.get(`${backend_url}/markets`);
  return response.data;
};
