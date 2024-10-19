import { getTicker } from "@/controllers/ticker.controller";
import { Router } from "express";

export const tickersRouter = Router();

tickersRouter.get("/", getTicker);
