import { WebSocket } from "ws";
import { outGoingMessageSchema } from "@/types/out";
import { SubscriptionManager } from "./SubscriptionManager";
import { incomingMessageSchema, MessageType } from "@/types/in";
import { z } from "zod";

/**
 * Represents a connected WebSocket user
 * Handles user-specific WebSocket communication and subscription management
 */
export class User {
  private id: string;
  private ws: WebSocket;
  private subscriptions: string[] = [];

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListners();
  }

  /**
   * Adds a subscription to the user's list
   * @param subscription - The channel to subscribe to
   */
  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  /**
   * Removes a subscription from the user's list
   * @param subscription - The channel to unsubscribe from
   */
  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter(
      (sub) => sub !== subscription
    );
  }

  /**
   * Sends a validated message to the WebSocket client
   * @param message - The message to send
   */
  emit(message: z.infer<typeof outGoingMessageSchema>) {
    const msg = outGoingMessageSchema.safeParse(message);
    if (!msg.success) {
      return;
    }
    this.ws.send(JSON.stringify(msg.data));
  }

  /**
   * Sets up WebSocket message listeners
   * Handles subscription and unsubscription requests
   */
  private addListners() {
    this.ws.on("message", (message: string) => {
      const { data: msg, success } = incomingMessageSchema.safeParse(
        JSON.parse(message)
      );
      if (!success) {
        return;
      }

      // Handle subscription requests
      if (msg.method === MessageType.SUBSCRIBE) {
        msg.params.forEach((s) =>
          SubscriptionManager.getInstance().subscribe(this.id, s)
        );
      }

      // Handle unsubscription requests
      if (msg.method === MessageType.UNSUBSCRIBE) {
        msg.params.forEach((s) =>
          SubscriptionManager.getInstance().unsubscribe(this.id, msg.params[0])
        );
      }
    });
  }
}
