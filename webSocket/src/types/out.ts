import { z } from "zod";

export const tickerUpdateMessageSchema = z.object({
  type: z.literal("ticker"),
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

export const depthUpdateSchema = z.object({
  type: z.literal("depth"),
  data: z.object({
    b: z.array(z.tuple([z.string(), z.string()])).optional(),
    a: z.array(z.tuple([z.string(), z.string()])).optional(),
    id: z.number(),
    e: z.literal("depth"),
  }),
});

export const outGoingMessageSchema = z.union([
  depthUpdateSchema,
  tickerUpdateMessageSchema,
]);
