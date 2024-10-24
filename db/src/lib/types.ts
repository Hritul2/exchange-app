import { z } from "zod";

export const dbMessageSchema = z.union([
  z.object({
    type: z.literal("TRADE_ADDED"),
    data: z.object({
      id: z.string(),
      isBuyerMaker: z.boolean(),
      price: z.string(),
      quantity: z.string(),
      quoteQuantity: z.string(),
      timestamp: z.number(),
      market: z.string(),
    }),
  }),
  z.object({
    type: z.literal("ORDER_UPDATE"),
    data: z.object({
      orderId: z.string(),
      executedQty: z.string(),
      market: z.string().optional(),
      price: z.string().optional(),
      quantity: z.string().optional(),
      side: z.union([z.literal("buy"), z.literal("sell")]).optional(),
    }),
  }),
]);

export type DbMessage = z.infer<typeof dbMessageSchema>;
