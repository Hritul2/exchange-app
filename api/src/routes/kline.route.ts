import { getKline } from "@/controllers/kline.controller";
import { Router } from "express";

export const klineRouter = Router();

klineRouter.get("/", getKline);
