import z, { number } from "zod";
import { OrderBookEventEnum } from "./events.type";

const tradeAddedSchema = z.object({
  type: z.literal(OrderBookEventEnum.TRADE_ADDED),
  data: z.object({
    id: z.string(),
    isBuyerMaker: z.boolean(),
    price: z.string(),
    quantity: z.string(),
    quoteQuantity: z.string(),
    timestamp: z.number(),
    market: z.string(),
  }),
});

const orderUpdatedSchema = z.object({
  type: z.literal(OrderBookEventEnum.ORDER_UPDATE),
  data: z.object({
    orderId: z.string(),
    executedQty: z.number(),
    market: z.string().optional(),
    price: z.string().optional(),
    quantity: z.string().optional(),
    side: z.enum(["buy", "sell"]).optional(),
  }),
});

const balanceUpdateSchema = z.object({
  type: z.literal(OrderBookEventEnum.BALANCE_UPDATE),
  data: z.object({
    userId: z.string(),
    asset: z.string(),
    available: z.number().optional(),
    locked: z.number().optional(),
  }),
});

export const dbMessageSchema = z.union([
  tradeAddedSchema,
  orderUpdatedSchema,
  balanceUpdateSchema,
]);
export type DbMessage = z.infer<typeof dbMessageSchema>;
