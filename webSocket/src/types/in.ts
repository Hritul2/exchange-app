import { z } from "zod";

export const enum MessageType {
  SUBSCRIBE = "SUBSCRIBE",
  UNSUBSCRIBE = "UNSUBSCRIBE",
}

export const subscribeMessageSchema = z.object({
  method: z.literal(MessageType.SUBSCRIBE),
  params: z.array(z.string()),
});

export const unsubscribeMessageSchema = z.object({
  method: z.literal(MessageType.UNSUBSCRIBE),
  params: z.array(z.string()),
});

export const incomingMessageSchema = z.union([
  subscribeMessageSchema,
  unsubscribeMessageSchema,
]);
