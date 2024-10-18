import { Request, Response, NextFunction } from "express";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";

// Error handling middleware

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message =
    err instanceof ApiError ? err.message : "Internal Server Error";
  res.status(statusCode).json(new ApiResponse(statusCode, null, message));
};
