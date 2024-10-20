import z from "zod";
import { BASE_CURRENCY } from "./Engine";

export const orderSchema = z.object({
  price: z.number().positive("Price must be positive"),
  quantity: z.number().positive("Quantity must be positive"),
  orderId: z.string(),
  filled: z.number(),
  side: z.enum(["buy", "sell"]),
  userId: z.string(),
});

export type Order = z.infer<typeof orderSchema>;

export const fillSchema = z.object({
  price: z.string(),
  qty: z.number(),
  tradeId: z.number(),
  otherUserId: z.string(),
  makerOrderId: z.string(),
});
export type Fill = z.infer<typeof fillSchema>;

export class Orderbook {
  bids: Order[];
  asks: Order[];
  baseAsset: string;
  quoteAsset: string = BASE_CURRENCY;
  lastTradeId: number;
  currentPrice: number;

  // Depth maps for bids and asks to track cumulative quantity at each price level
  bidsDepth: { [key: string]: number } = {};
  asksDepth: { [key: string]: number } = {};

  constructor(
    baseAsset: string,
    bids: Order[],
    asks: Order[],
    lastTradeId: number,
    currentPrice: number
  ) {
    this.baseAsset = baseAsset;
    this.bids = bids;
    this.asks = asks;
    this.lastTradeId = lastTradeId || 0;
    this.currentPrice = currentPrice || 0;

    // Initialize depth maps from the initial bids and asks
    this.initializeDepth();
  }

  /**
   * Initializes the depth maps for bids and asks by iterating through the order book
   * and summing up the quantities at each price level.
   */
  initializeDepth() {
    // For loop to aggregate bid quantities at each price level
    for (let bid of this.bids) {
      if (!this.bidsDepth[bid.price]) {
        this.bidsDepth[bid.price] = 0;
      }
      this.bidsDepth[bid.price] += bid.quantity;
    }

    // For loop to aggregate ask quantities at each price level
    for (let ask of this.asks) {
      if (!this.asksDepth[ask.price]) {
        this.asksDepth[ask.price] = 0;
      }
      this.asksDepth[ask.price] += ask.quantity;
    }
  }

  // Returns the ticker symbol representing the market pair (e.g., BTC_USD)
  ticker() {
    return `${this.baseAsset}_${this.quoteAsset}`;
  }

  /**
   * Provides a snapshot of the current state of the order book, including bids,
   * asks, last trade ID, and the current price.
   */
  getSnapshot() {
    return {
      baseAsset: this.baseAsset,
      bids: this.bids,
      asks: this.asks,
      lastTradeId: this.lastTradeId,
      currentPrice: this.currentPrice,
    };
  }

  /**
   * Matches a buy order (bid) against existing sell orders (asks).
   * Fills the bid order by comparing it with the asks and updating the ask orders' filled quantities.
   * Returns the list of fills and the total executed quantity for the bid.
   */
  matchBid(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    // For loop to match the buy order against the existing asks
    for (let i = 0; i < this.asks.length; i++) {
      // If the ask price is less than or equal to the bid price, match the order
      if (this.asks[i].price <= order.price && executedQty < order.quantity) {
        const filledQty = Math.min(
          order.quantity - executedQty,
          this.asks[i].quantity
        );
        executedQty += filledQty;
        this.asks[i].filled += filledQty;

        // Update asksDepth as we fill the ask order
        this.updateDepth(this.asksDepth, this.asks[i].price, -filledQty);

        // Create a fill entry for this match
        fills.push({
          price: this.asks[i].price.toString(),
          qty: filledQty,
          tradeId: this.lastTradeId++,
          otherUserId: this.asks[i].userId,
          makerOrderId: this.asks[i].orderId,
        });
      }
    }

    // Remove fully filled asks from the order book
    for (let i = 0; i < this.asks.length; i++) {
      if (this.asks[i].filled === this.asks[i].quantity) {
        this.asks.splice(i, 1);
        i--; // Adjust the index after removal
      }
    }

    return { fills, executedQty };
  }

  /**
   * Matches a sell order (ask) against existing buy orders (bids).
   * Fills the ask order by comparing it with the bids and updating the bid orders' filled quantities.
   * Returns the list of fills and the total executed quantity for the ask.
   */
  matchAsk(order: Order): { fills: Fill[]; executedQty: number } {
    const fills: Fill[] = [];
    let executedQty = 0;

    // For loop to match the sell order against the existing bids
    for (let i = 0; i < this.bids.length; i++) {
      // If the bid price is greater than or equal to the ask price, match the order
      if (this.bids[i].price >= order.price && executedQty < order.quantity) {
        const amountRemaining = Math.min(
          order.quantity - executedQty,
          this.bids[i].quantity
        );
        executedQty += amountRemaining;
        this.bids[i].filled += amountRemaining;

        // Update bidsDepth as we fill the bid order
        this.updateDepth(this.bidsDepth, this.bids[i].price, -amountRemaining);

        // Create a fill entry for this match
        fills.push({
          price: this.bids[i].price.toString(),
          qty: amountRemaining,
          tradeId: this.lastTradeId++,
          otherUserId: this.bids[i].userId,
          makerOrderId: this.bids[i].orderId,
        });
      }
    }

    // Remove fully filled bids from the order book
    for (let i = 0; i < this.bids.length; i++) {
      if (this.bids[i].filled === this.bids[i].quantity) {
        this.bids.splice(i, 1);
        i--; // Adjust the index after removal
      }
    }
    return { fills, executedQty };
  }

  /**
   * Adds an order (buy or sell) to the order book.
   * If the order is fully matched against existing orders, it is not added to the book.
   * If partially filled, the remaining part of the order is added to the bids or asks.
   * Returns the total executed quantity and the fills.
   */
  addOrder(order: Order): { executedQty: number; fills: Fill[] } {
    if (order.side == "buy") {
      const { executedQty, fills } = this.matchBid(order);
      // If the order is fully matched, no need to add it to the book
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      // Otherwise, add the remaining portion to the bids
      this.bids.push(order);
      // Update bidsDepth for the new bid order
      this.updateDepth(this.bidsDepth, order.price, order.quantity);
      return { executedQty, fills };
    } else {
      const { executedQty, fills } = this.matchAsk(order);
      // If the order is fully matched, no need to add it to the book
      if (executedQty === order.quantity) {
        return { executedQty, fills };
      }
      // Otherwise, add the remaining portion to the asks
      this.asks.push(order);
      // Update asksDepth for the new ask order
      this.updateDepth(this.asksDepth, order.price, order.quantity);
      return { executedQty, fills };
    }
  }

  /**
   * Helper function to update the depth map when an order is added, matched, or canceled.
   * Adjusts the cumulative quantity at a price level.
   */
  updateDepth(depthMap: { [key: string]: number }, price: number, qty: number) {
    if (!depthMap[price]) {
      depthMap[price] = 0;
    }
    depthMap[price] += qty;

    // Remove price from the depth map if the quantity becomes zero or less
    if (depthMap[price] <= 0) {
      delete depthMap[price];
    }
  }

  /**
   * Returns the current market depth (cumulative quantities at each price level)
   * for both bids and asks without needing to recompute from scratch.
   */
  getDepth() {
    const bids: [string, string][] = [];
    const asks: [string, string][] = [];

    // For loop to construct the bids depth from the depth map
    for (const price in this.bidsDepth) {
      bids.push([price, this.bidsDepth[price].toString()]);
    }

    // For loop to construct the asks depth from the depth map
    for (const price in this.asksDepth) {
      asks.push([price, this.asksDepth[price].toString()]);
    }

    return { bids, asks };
  }

  /**
   * Returns all open (unfilled) orders for a given user, both buy and sell.
   */
  getOpenOrders(userId: string): Order[] {
    // Filter open asks for the user
    const asks = this.asks.filter((x) => x.userId === userId);
    // Filter open bids for the user
    const bids = this.bids.filter((x) => x.userId === userId);
    return [...asks, ...bids];
  }

  /**
   * Cancels a buy order from the order book and updates the depth accordingly.
   * Returns the price of the canceled order.
   */
  cancelBid(order: Order) {
    const index = this.bids.findIndex((x) => x.orderId === order.orderId);
    const price = this.bids[index].price;
    // Update depth map to remove the quantity of the canceled order
    this.updateDepth(this.bidsDepth, price, -this.bids[index].quantity);
    // Remove the bid from the order book
    this.bids.splice(index, 1);
    return price;
  }

  /**
   * Cancels a sell order from the order book and updates the depth accordingly.
   * Returns the price of the canceled order.
   */
  cancelAsk(order: Order) {
    const index = this.asks.findIndex((x) => x.orderId === order.orderId);
    const price = this.asks[index].price;
    // Update depth map to remove the quantity of the canceled order
    this.updateDepth(this.asksDepth, price, -this.asks[index].quantity);
    // Remove the ask from the order book
    this.asks.splice(index, 1);
    return price;
  }
}
