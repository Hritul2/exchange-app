import z from "zod";

export enum OrderBookEventEnum {
  DEPT_UPDATE = "DEPT_UPDATE",
  TICKER_UPDATE = "TICKER_UPDATE",
  ORDER_UPDATE = "ORDER_UPDATE",
  TRADE_ADDED = "TRADE_ADDED",
}
export const OrderBookEvent = z.enum([
  OrderBookEventEnum.DEPT_UPDATE,
  OrderBookEventEnum.TICKER_UPDATE,
  OrderBookEventEnum.ORDER_UPDATE,
  OrderBookEventEnum.TRADE_ADDED,
]);

export type OrderBookEvent = z.infer<typeof OrderBookEvent>;
