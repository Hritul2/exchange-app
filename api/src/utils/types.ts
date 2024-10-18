import { z } from "zod";

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

// ActionTypes Zod schema

export const actionTypesSchema = z.enum([
  "CREATE_ORDER",
  "CANCEL_ORDER",
  "ON_RAMP",
  "GET_DEPTH",
  "GET_OPEN_ORDERS",
]);
export enum ActionTypesEnum {
  CREATE_ORDER = "CREATE_ORDER",
  CANCEL_ORDER = "CANCEL_ORDER",
  ON_RAMP = "ON_RAMP",
  GET_DEPTH = "GET_DEPTH",
  GET_OPEN_ORDERS = "GET_OPEN_ORDERS",
}
export type ActionTypes = z.infer<typeof actionTypesSchema>;

// MessageToEngine Zod schema
export const messageToOrderbookEngineSchema = z.union([
  z.object({
    type: z.literal(ActionTypesEnum.CREATE_ORDER),
    data: z.object({
      market: z.string(),
      price: z.string(),
      quantity: z.string(),
      side: z.enum(["buy", "sell"]),
      userId: z.string(),
    }),
  }),
  z.object({
    type: z.literal(ActionTypesEnum.CANCEL_ORDER),
    data: z.object({
      orderId: z.string(),
      market: z.string(),
    }),
  }),
  z.object({
    type: z.literal(ActionTypesEnum.ON_RAMP),
    data: z.object({
      amount: z.string(),
      userId: z.string(),
      txnId: z.string(),
    }),
  }),
  z.object({
    type: z.literal(ActionTypesEnum.GET_DEPTH),
    data: z.object({
      market: z.string(),
    }),
  }),
  z.object({
    type: z.literal(ActionTypesEnum.GET_OPEN_ORDERS),
    data: z.object({
      userId: z.string(),
      market: z.string(),
    }),
  }),
]);

export type MessageToOrderbookEngine = z.infer<
  typeof messageToOrderbookEngineSchema
>;
