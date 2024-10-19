import z from "zod";
import { ActionTypesEnum } from "./actionTypes";

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
