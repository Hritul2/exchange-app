import { getTrades } from "@/controllers/trades.controller";
import { Router } from "express";

export const tradesRouter = Router();

tradesRouter.get("/", getTrades);
