import { SocketManagerType, websocket_url } from "./constants"; // Import WebSocket URL from constants
import { Ticker } from "@/utils/types"; // Import the Ticker type

export class SocketManager {
  private ws: WebSocket; // WebSocket instance
  private static instance: SocketManager; // Singleton instance of SocketManager
  private bufferedMessages: any[] = []; // Buffer to store messages when WebSocket is not ready
  private callbacks: any = {}; // Store callbacks for different message types (e.g., 'ticker', 'depth')
  private id: number; // Message ID counter
  private initialized: boolean = false; // Flag to check if WebSocket is open and ready

  // Private constructor to enforce Singleton pattern
  private constructor() {
    this.ws = new WebSocket(websocket_url); // Initialize WebSocket connection
    this.bufferedMessages = []; // Initialize message buffer
    this.id = 1; // Set the message ID starting point
    this.init(); // Initialize WebSocket event handlers
  }

  // Static method to get the Singleton instance of SocketManager
  public static getInstance() {
    if (!this.instance) {
      this.instance = new SocketManager(); // Create instance if it doesn't exist
    }
    return this.instance; // Return the singleton instance
  }

  // Method to send a message to the WebSocket server
  sendMessage(message: any) {
    const messageToSend = {
      ...message, // Spread the message content
      id: this.id++, // Add a unique message ID
    };
    if (!this.initialized) {
      this.bufferedMessages.push(messageToSend); // Buffer the message if WebSocket isn't ready
      return;
    }
    this.ws.send(JSON.stringify(messageToSend)); // Send the message to the WebSocket server
  }

  // Method to register a callback for a specific message type
  async registerCallback(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || []; // Initialize the callback array if not present
    this.callbacks[type].push({ callback, id }); // Add the callback with its ID
  }

  // Method to de-register (remove) a callback for a specific message type
  async deRegisterCallback(type: string, id: string) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex(
        (callback) => callback.id === id // Find the callback by its ID
      );
      if (index !== -1) {
        this.callbacks[type].splice(index, 1); // Remove the callback if found
      }
    }
  }

  // Initialize WebSocket event handlers
  init() {
    // WebSocket onopen event: called when connection is established
    this.ws.onopen = () => {
      this.initialized = true; // Set the WebSocket to ready state
      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message)); // Send buffered messages after connection is open
      });
      this.bufferedMessages = []; // Clear the buffer
    };

    // WebSocket onmessage event: called when a message is received
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data); // Parse the incoming message
      const type = message.data.e; // Extract the message type (e.g., 'ticker', 'depth')

      // Check if there are any callbacks registered for the message type
      if (this.callbacks[type]) {
        this.callbacks[type].forEach(({ callback }) => {
          // If the message type is 'ticker', format the Ticker data and call the callback
          if (type === SocketManagerType.Ticker) {
            const newTicker: Partial<Ticker> = {
              lastPrice: message.data.c,
              high: message.data.h,
              low: message.data.l,
              volume: message.data.v,
              quoteVolume: message.data.V,
              symbol: message.data.s,
            };

            callback(newTicker); // Invoke the callback with the formatted ticker data
          }

          // If the message type is 'depth', format the bid and ask data and call the callback
          if (type === SocketManagerType.Depth) {
            const updatedBids = message.data.b;
            const updatedAsks = message.data.a;
            callback({ bids: updatedBids, asks: updatedAsks }); // Invoke the callback with bid/ask data
          }
        });
      }
    };
  }
}
