import { Request, Response, NextFunction, RequestHandler } from "express";

// Define the asyncHandler function with types
const asyncHandler = (requestHandler: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};

export { asyncHandler };
