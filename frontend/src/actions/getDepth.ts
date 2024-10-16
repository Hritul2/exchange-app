"use server";

import { backend_url } from "@/utils/constants";
import axios from "axios";
import { Depth, depthSchema } from "@/utils/types";

export const getDepth = async (market: string): Promise<Depth> => {
  const response = await axios.get(`${backend_url}/depth?symbol=${market}`);
  const result = depthSchema.safeParse(response.data);
  if (result.success) {
    return result.data;
  } else {
    console.error("Invalid data format:", result.error);
    throw new Error("Failed to parse depth data");
  }
};
