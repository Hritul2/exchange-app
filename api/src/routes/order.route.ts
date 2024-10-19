import {
  deleteOrder,
  getOpenOrders,
  postOrder,
} from "@/controllers/order.controller";
import { Router } from "express";

export const orderRouter = Router();

orderRouter.post("/", postOrder);
orderRouter.delete("/", deleteOrder);
orderRouter.get("/open", getOpenOrders);
