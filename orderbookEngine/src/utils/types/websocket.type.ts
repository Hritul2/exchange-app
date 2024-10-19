import z from "zod";

export const tickerUpdateMessageSchema = z.object({
  stream: z.string(),
  data: z.object({
    c: z.string().optional(),
    h: z.string().optional(),
    l: z.string().optional(),
    v: z.string().optional(),
    V: z.string().optional(),
    s: z.string().optional(),
    id: z.number(),
    e: z.literal("ticker"),
  }),
});

export type TickerUpdateMessage = z.infer<typeof tickerUpdateMessageSchema>;

export const depthUpdateMessageSchema = z.object({
  stream: z.string(),
  data: z.object({
    b: z.array(z.tuple([z.string(), z.string()])).optional(),
    a: z.array(z.tuple([z.string(), z.string()])).optional(),
    e: z.literal("depth"),
  }),
});

export type DepthUpdateMessage = z.infer<typeof depthUpdateMessageSchema>;

export const tradeAddedMessageSchema = z.object({
  stream: z.string(),
  data: z.object({
    e: z.literal("trade"),
    t: z.number(),
    m: z.boolean(),
    p: z.string(),
    q: z.string(),
    s: z.string(),
  }),
});

export type TradeAddedMessage = z.infer<typeof tradeAddedMessageSchema>;

export const websocketMessageSchema = z.union([
  tickerUpdateMessageSchema,
  depthUpdateMessageSchema,
  tradeAddedMessageSchema,
]);

export type WebsocketMessage = z.infer<typeof websocketMessageSchema>;
