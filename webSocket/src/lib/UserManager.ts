import { WebSocket } from "ws";
import { User } from "@/lib/User";
import { SubscriptionManager } from "./SubscriptionManager";

/**
 * Manages WebSocket users and their connections
 * Implements the Singleton pattern to ensure only one instance exists
 */
export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map();

  private constructor() {}

  /**
   * Returns the singleton instance of UserManager
   */
  public static getInstance(): UserManager {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  /**
   * Creates a new user with a WebSocket connection
   * @param ws - The WebSocket connection
   * @returns The created User instance
   */
  public addUser(ws: WebSocket) {
    const id = this.getRandomId();
    const user = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    return user;
  }

  /**
   * Retrieves a user by their ID
   * @param id - The user's ID
   * @returns The User instance or undefined if not found
   */
  public getUser(id: string) {
    return this.users.get(id);
  }

  /**
   * Generates a random user ID
   * @returns A random string ID
   */
  public getRandomId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  /**
   * Sets up cleanup handlers for when a user disconnects
   * @param ws - The WebSocket connection
   * @param id - The user's ID
   */
  private registerOnClose(ws: WebSocket, id: string) {
    ws.on("close", () => {
      this.users.delete(id);
      SubscriptionManager.getInstance().userLeft(id);
    });
  }
}
