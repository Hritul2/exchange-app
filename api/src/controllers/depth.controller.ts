import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { ActionTypesEnum } from "@/utils/types";
import { RedisManager } from "@/lib/RedisManager";
import { Request, Response } from "express";

const getDepth = asyncHandler(async (req: Request, res: Response) => {
  const { symbol } = req.query;

  // Ensure symbol is defined
  if (!symbol || typeof symbol !== "string") {
    throw new ApiError(400, "Symbol is required and should be a string");
  }

  // Fetch data from RedisManager
  const response = await RedisManager.getInstance().sendAndAwait({
    type: ActionTypesEnum.GET_DEPTH,
    data: {
      market: symbol,
    },
  });

  // Handle if no data is found
  if (!response) {
    throw new ApiError(404, "No data found for the given symbol");
  }

  // Send the response to the client
  res.status(200).json(new ApiResponse(200, response.payload));
  return;
});

export { getDepth };
