import z from "zod";

export const kLineSchema = z.object({
  close: z.string(),
  end: z.string(),
  high: z.string(),
  low: z.string(),
  open: z.string(),
  quoteVolume: z.string(),
  start: z.string(),
  trades: z.string(),
  volume: z.string(),
});

export type KLine = z.infer<typeof kLineSchema>;

export const tradeSchema = z.object({
  id: z.number(),
  isBuyerMaker: z.boolean(),
  price: z.string(),
  quantity: z.string(),
  quoteQuantity: z.string(),
  timestamp: z.number(),
});

export type Trade = z.infer<typeof tradeSchema>;

export const depthSchema = z.object({
  bids: z.array(z.tuple([z.string(), z.string()])),
  asks: z.array(z.tuple([z.string(), z.string()])),
  lastUpdateId: z.string(),
});

export type Depth = z.infer<typeof depthSchema>;

export const tickerSchema = z.object({
  firstPrice: z.string(),
  high: z.string(),
  lastPrice: z.string(),
  low: z.string(),
  priceChange: z.string(),
  priceChangePercent: z.string(),
  quoteVolume: z.string(),
  symbol: z.string(),
  trades: z.string(),
  volume: z.string(),
});

export type Ticker = z.infer<typeof tickerSchema>;
