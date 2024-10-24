import { RedisClientType, createClient } from "redis";
import { UserManager } from "./UserManager";

/**
 * Manages WebSocket subscriptions using Redis pub/sub functionality
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class SubscriptionManager {
  private static instance: SubscriptionManager;

  // Maps userId to their subscribed channels
  private subscription: Map<string, string[]> = new Map();

  // Maps channels to subscribed userIds (inverse mapping)
  private reverseSubscription: Map<string, string[]> = new Map();

  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.connect();
  }

  /**
   * Returns the singleton instance of SubscriptionManager
   */
  public static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  /**
   * Subscribes a user to a specific channel
   * @param userId - The ID of the user
   * @param subscription - The channel name to subscribe to
   */
  public subscribe(userId: string, subscription: string) {
    // Prevent duplicate subscriptions
    if (this.subscription.get(userId)?.includes(subscription)) {
      return;
    }

    // Update user's subscriptions
    this.subscription.set(
      userId,
      (this.subscription.get(userId) || []).concat(subscription)
    );

    // Update reverse mapping
    this.reverseSubscription.set(
      subscription,
      (this.reverseSubscription.get(subscription) || []).concat(userId)
    );

    // Subscribe to Redis channel if this is the first subscriber
    if (this.reverseSubscription.get(subscription)?.length === 1) {
      this.redisClient.subscribe(subscription, this.redisCallbackHandler);
    }
  }

  /**
   * Handles incoming Redis messages and broadcasts them to subscribed users
   */
  private redisCallbackHandler = (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    this.reverseSubscription.get(channel)?.forEach((userId) => {
      UserManager.getInstance().getUser(userId)?.emit(parsedMessage);
    });
  };

  /**
   * Unsubscribes a user from a specific channel
   * @param userId - The ID of the user
   * @param subscription - The channel to unsubscribe from
   */
  public unsubscribe(userId: string, subscription: string) {
    // Remove subscription from user's list
    const subscriptions = this.subscription.get(userId);
    if (subscriptions) {
      this.subscription.set(
        userId,
        subscriptions.filter((sub) => sub !== subscription)
      );
    }

    // Update reverse mapping
    const reverseSubscriptions = this.reverseSubscription.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscription.set(
        subscription,
        reverseSubscriptions.filter((sub) => sub !== userId)
      );

      // If no more subscribers, clean up Redis subscription
      if (this.reverseSubscription.get(subscription)?.length === 0) {
        this.reverseSubscription.delete(subscription);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }

  /**
   * Handles cleanup when a user disconnects
   * @param userId - The ID of the disconnected user
   */
  public userLeft(userId: string) {
    console.log(`User ${userId} left`);
    this.subscription
      .get(userId)
      ?.forEach((sub) => this.unsubscribe(userId, sub));
  }

  /**
   * Gets all subscriptions for a user
   * @param userId - The ID of the user
   * @returns Array of subscription channels
   */
  getSubscription(userId: string) {
    return this.subscription.get(userId) || [];
  }
}
