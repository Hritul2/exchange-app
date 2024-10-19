import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";

export const getTrades = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, {}));
});
