import { z } from "zod";
import { ActionTypesEnum } from "@/utils/types/actionTypes.type";

const createOrderSchema = z.object({
  type: z.literal(ActionTypesEnum.CREATE_ORDER),
  data: z.object({
    market: z.string(),
    price: z.string(),
    quantity: z.string(),
    side: z.enum(["buy", "sell"]),
    userId: z.string(),
  }),
});

const cancelOrder = z.object({
  type: z.literal(ActionTypesEnum.CANCEL_ORDER),
  data: z.object({
    orderId: z.string(),
    market: z.string(),
  }),
});

const onRampSchema = z.object({
  type: z.literal(ActionTypesEnum.ON_RAMP),
  data: z.object({
    amount: z.string(),
    userId: z.string(),
    txnId: z.string(),
  }),
});
const getDepthSchema = z.object({
  type: z.literal(ActionTypesEnum.GET_DEPTH),
  data: z.object({
    market: z.string(),
  }),
});

const getOpenOrdersSchema = z.object({
  type: z.literal(ActionTypesEnum.GET_OPEN_ORDERS),
  data: z.object({
    userId: z.string(),
    market: z.string(),
  }),
});

export const messageFromApiSchema = z.union([
  createOrderSchema,
  cancelOrder,
  onRampSchema,
  getDepthSchema,
  getOpenOrdersSchema,
]);

export type MessageFromApi = z.infer<typeof messageFromApiSchema>;
