import { RedisClientType, createClient } from "redis";
import {
  MessageFromOrderbookEngine,
  MessageToOrderbookEngine,
} from "@/utils/types";

export class RedisManager {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.publisher = createClient();

    this.client.connect();
    this.publisher.connect();
  }

  public static getInstance(): RedisManager {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public getRandomClientId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  public sendAndAwait(message: MessageToOrderbookEngine) {
    return new Promise<MessageFromOrderbookEngine>((resolve) => {
      const id = this.getRandomClientId();
      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resolve(JSON.parse(message));
      });
      this.publisher.lPush(
        "messages",
        JSON.stringify({ clientId: id, message })
      );
    });
  }
}
