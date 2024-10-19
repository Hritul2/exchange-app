import z from "zod";

// MessageFromOrderbook Zod schema
export const messageFromOrderbookEngineSchema = z.union([
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

export type MessageFromOrderbookEngine = z.infer<
  typeof messageFromOrderbookEngineSchema
>;
