import { asyncHandler } from "@/utils/asyncHandler";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";

import { RedisManager } from "@/lib/RedisManager";
import { ActionTypesEnum } from "@/utils/types/actionTypes.type";

export const postOrder = asyncHandler(async (req, res) => {
  const { market, price, quantity, side, userId } = req.body;
  if (!market) {
    throw new ApiError(400, "Market is required");
  }
  if (!price) {
    throw new ApiError(400, "Price is required");
  }
  if (!quantity) {
    throw new ApiError(400, "Quantity is required");
  }
  if (!side) {
    throw new ApiError(400, "Side is required");
  }
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const response = await RedisManager.getInstance().sendAndAwait({
    type: ActionTypesEnum.CREATE_ORDER,
    data: {
      market,
      price,
      quantity,
      side,
      userId,
    },
  });

  if (!response) {
    throw new ApiError(500, "Internal server error");
  }
  res.status(200).json(new ApiResponse(200, response.payload));
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const { orderId, market } = req.body;
  if (!orderId) {
    throw new ApiError(400, "Order ID is required");
  }
  if (!market) {
    throw new ApiError(400, "Market is required");
  }
  const response = await RedisManager.getInstance().sendAndAwait({
    type: ActionTypesEnum.CANCEL_ORDER,
    data: {
      orderId,
      market,
    },
  });
  if (!response) {
    throw new ApiError(500, "Internal server error");
  }
  res.status(200).json(new ApiResponse(200, response.payload));
});

export const getOpenOrders = asyncHandler(async (req, res) => {
  const { userId, market } = req.query;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  if (!market) {
    throw new ApiError(400, "Market is required");
  }
  const response = await RedisManager.getInstance().sendAndAwait({
    type: ActionTypesEnum.GET_OPEN_ORDERS,
    data: {
      userId: userId as string,
      market: market as string,
    },
  });
  if (!response) {
    throw new ApiError(500, "Internal server error");
  }
  res.status(200).json(new ApiResponse(200, response.payload));
});
