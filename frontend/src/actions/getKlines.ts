"use server";

import { backend_url } from "@/utils/constants";
import axios from "axios";
import { KLine, kLineSchema } from "@/utils/types"; // assuming KLine and kLineSchema are defined
import { z } from "zod";

const kLinesArraySchema = z.array(kLineSchema);

export const getKLines = async (
  market: string,
  interval: string,
  startTime: number,
  endTime: number
): Promise<KLine[]> => {
  const response = await axios.get(
    `${backend_url}/klines?symbol=${market}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`
  );

  const data = response.data;

  // Safe parsing for an array of KLine objects
  const result = kLinesArraySchema.safeParse(data);

  if (result.success) {
    return result.data.sort((x, y) => (Number(x.end) < Number(y.end) ? -1 : 1));
  } else {
    console.error("Invalid data format:", result.error);
    throw new Error("Failed to parse KLines data");
  }
};
