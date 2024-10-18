import { z } from "zod";

// MessageFromOrderbook Zod schema
export const MessageFromOrderbookSchema = z.union([
  z.object({
    type: z.literal("DEPTH"),
    payload: z.object({
      market: z.string(),
      bids: z.array(z.tuple([z.string(), z.string()])),
      asks: z.array(z.tuple([z.string(), z.string()])),
    }),
  }),
  z.object({
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
  }),
  z.object({
    type: z.literal("ORDER_CANCELLED"),
    payload: z.object({
      orderId: z.string(),
      executedQty: z.number(),
      remainingQty: z.number(),
    }),
  }),
  z.object({
    type: z.literal("OPEN_ORDERS"),
    payload: z.array(
      z.object({
        orderId: z.string(),
        executedQty: z.number(),
        price: z.string(),
        quantity: z.string(),
        side: z.enum(["buy", "sell"]),
        userId: z.string(),
      })
    ),
  }),
]);

export type MessageFromOrderbook = z.infer<typeof MessageFromOrderbookSchema>;

// MessageToEngine Zod schema
export const MessageToEngineSchema = z.union([
  z.object({
    type: z.literal("CREATE_ORDER"),
    data: z.object({
      market: z.string(),
      price: z.string(),
      quantity: z.string(),
      side: z.enum(["buy", "sell"]),
      userId: z.string(),
    }),
  }),
  z.object({
    type: z.literal("CANCEL_ORDER"),
    data: z.object({
      orderId: z.string(),
      market: z.string(),
    }),
  }),
  z.object({
    type: z.literal("ON_RAMP"),
    data: z.object({
      amount: z.string(),
      userId: z.string(),
      txnId: z.string(),
    }),
  }),
  z.object({
    type: z.literal("GET_DEPTH"),
    data: z.object({
      market: z.string(),
    }),
  }),
  z.object({
    type: z.literal("GET_OPEN_ORDERS"),
    data: z.object({
      userId: z.string(),
      market: z.string(),
    }),
  }),
]);

export type MessageToEngine = z.infer<typeof MessageToEngineSchema>;
