import { z } from "zod";

export const orderSchema = z.object({
  price: z.string(),
  quantity: z.number(),
  orderId: z.string(),
  filled: z.number(),
  side: z.enum(["buy", "sell"]),
  userId: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

const depthSchema = z.object({
  type: z.literal("DEPTH"),
  payload: z.object({
    market: z.string(),
    bids: z.array(z.tuple([z.string(), z.string()])),
    asks: z.array(z.tuple([z.string(), z.string()])),
  }),
});

const orderPlacedSchema = z.object({
  type: z.literal("ORDER_PLACED"),
  payload: z.object({
    orderId: z.string(),
    executedQty: z.number(),
    fills: z.array(
      z.object({
        price: z.string(),
        qty: z.number(),
        tradeId: z.number(),
      })
    ),
  }),
});

const orderCandledSchema = z.object({
  type: z.literal("ORDER_CANCELLED"),
  payload: z.object({
    orderId: z.string(),
    executedQty: z.number(),
    remainingQty: z.number(),
  }),
});

const openOrderSchema = z.object({
  type: z.literal("OPEN_ORDERS"),
  payload: z.array(orderSchema),
});

export const messageFromOrderbookEngineSchema = z.union([
  depthSchema,
  orderPlacedSchema,
  orderCandledSchema,
  openOrderSchema,
]);

export type MessageFromOrderbookEngine = z.infer<
  typeof messageFromOrderbookEngineSchema
>;
