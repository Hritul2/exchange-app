import fs from "fs";
import z from "zod";
import { RedisManager } from "./RedisManager";
import { OrderBookEventEnum } from "@/utils/types/events.type";
import {
  MessageFromApi,
  CreateOrder,
  createOrderSchema,
  CancelOrder,
  GetOpenOrders,
  OnRamp,
  GetDepth,
} from "@/utils/types/messageFromApi.type";
import { ActionTypesEnum } from "@/utils/types/actionTypes.type";
import { Order, orderSchema, Fill, Orderbook } from "./Orderbook";

export const BASE_CURRENCY = "INR";

// schemas
const userBalanceSchema = z.record(
  z.string(),
  z.object({
    available: z.number().min(0),
    locked: z.number().min(0),
  })
);
type UserBalance = z.infer<typeof userBalanceSchema>;

const marketSchema = z.string().refine(
  (market) => {
    const parts = market.split("_");
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  },
  { message: "Invalid market format. Expected format: BASE_QUOTE" }
);

export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.loadSnapshot();
      this.startSnapshotTimer();
    } catch (error) {
      console.error("Failed to initialize engine:", error);
      this.initializeDefaultOrderbook();
      this.setBaseBalances();
    }
  }

  private initializeDefaultOrderbook() {
    this.orderbooks = [new Orderbook("TATA", [], [], 0, 0)];
  }

  private loadSnapshot() {
    if (!process.env.WITH_SNAPSHOT) {
      throw new Error("Snapshots disabled");
    }

    const data = fs.readFileSync("./snapshot.json");
    const snapshotObject = JSON.parse(data.toString());

    this.orderbooks = snapshotObject.orderbooks.map(
      (o: any) =>
        new Orderbook(
          o.baseAsset,
          o.bids,
          o.asks,
          o.lastTradeId,
          o.currentPrice
        )
    );
    this.balances = new Map(Object.entries(snapshotObject.balances));
  }

  private startSnapshotTimer() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }
    this.snapshotInterval = setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  public saveSnapshot() {
    const snapshotObject = {
      orderbooks: this.orderbooks.map((o) => o.getSnapshot()),
      balances: Object.fromEntries(this.balances),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotObject));
  }

  private validateMarket(market: string) {
    return marketSchema.parse(market);
  }

  private getAssetPair(market: string) {
    const validMarket = this.validateMarket(market);
    const [baseAsset, quoteAsset] = validMarket.split("_");
    return { baseAsset, quoteAsset };
  }

  private getOrderbook(market: string) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      throw new Error(`Orderbook not found for market: ${market}`);
    }
    return orderbook;
  }

  private updateUserBalance(
    userId: string,
    asset: string,
    availableDelta: number,
    lockedDelta: number
  ) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      throw new Error(`User ${userId} not found`);
    }

    if (!userBalance[asset]) {
      userBalance[asset] = { available: 0, locked: 0 };
    }

    const newAvailable = userBalance[asset].available + availableDelta;
    const newLocked = userBalance[asset].locked + lockedDelta;

    if (newAvailable < 0 || newLocked < 0) {
      throw new Error(`Insufficient balance for ${asset}`);
    }

    userBalance[asset].available = newAvailable;
    userBalance[asset].locked = newLocked;
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    try {
      const { type, data } = message;
      switch (type) {
        case ActionTypesEnum.CREATE_ORDER:
          return this.handleCreateOrder(data, clientId);
        case ActionTypesEnum.CANCEL_ORDER:
          return this.handleCancelOrder(data, clientId);
        case ActionTypesEnum.GET_OPEN_ORDERS:
          return this.handleGetOpenOrders(data, clientId);
        case ActionTypesEnum.ON_RAMP:
          return this.handleOnRamp(data);
        case ActionTypesEnum.GET_DEPTH:
          return this.handleGetDepth(data, clientId);
        default:
          throw new Error(`Unknown action type: ${type}`);
      }
    } catch (error) {
      console.error(`Error processing message: ${error}`);
      this.sendErrorResponse(clientId, error);
    }
  }

  private sendErrorResponse(clientId: string, error: any) {
    RedisManager.getInstance().sendToApi(clientId, {
      type: "ERROR",
      payload: {
        message: error.message || "An unknown error occurred",
      },
    });
  }

  private handleCreateOrder(
    data: Pick<CreateOrder, "data">["data"],
    clientId: string
  ) {
    const { executedQty, fills, orderId } = this.createOrder(
      data.market,
      data.price,
      data.quantity,
      data.side,
      data.userId
    );

    RedisManager.getInstance().sendToApi(clientId, {
      type: "ORDER_PLACED",
      payload: {
        orderId,
        executedQty,
        fills,
      },
    });
  }

  private handleCancelOrder(
    data: Pick<CancelOrder, "data">["data"],
    clientId: string
  ) {
    const { market, orderId } = data;
    const orderbook = this.getOrderbook(market);
    const { baseAsset, quoteAsset } = this.getAssetPair(market);

    const order = orderbook.findOrder(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (order.side === "buy") {
      const price = orderbook.cancelBid(order);
      const leftQuantity = (order.quantity - order.filled) * order.price;
      this.updateUserBalance(
        order.userId,
        BASE_CURRENCY,
        leftQuantity,
        -leftQuantity
      );
      if (price) {
        this.sendUpdatedDepthAt(price.toString(), market);
      }
    } else {
      const price = orderbook.cancelAsk(order);
      const leftQuantity = order.quantity - order.filled;
      this.updateUserBalance(
        order.userId,
        baseAsset,
        leftQuantity,
        -leftQuantity
      );
      if (price) {
        this.sendUpdatedDepthAt(price.toString(), market);
      }
    }

    RedisManager.getInstance().sendToApi(clientId, {
      type: "ORDER_CANCELLED",
      payload: {
        orderId,
        executedQty: order.filled,
        remainingQty: order.quantity - order.filled,
      },
    });
  }

  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string
  ) {
    const orderbook = this.getOrderbook(market);
    const { baseAsset, quoteAsset } = this.getAssetPair(market);

    const numericPrice = Number(price);
    const numericQuantity = Number(quantity);

    if (isNaN(numericPrice) || isNaN(numericQuantity)) {
      throw new Error("Invalid price or quantity");
    }

    this.checkAndLockFunds({
      baseAsset,
      quoteAsset,
      side,
      userId,
      price: numericPrice,
      quantity: numericQuantity,
    });

    const order: Order = {
      price: numericPrice,
      quantity: numericQuantity,
      orderId: this.generateOrderId(),
      filled: 0,
      side,
      userId,
    };

    const { fills, executedQty } = orderbook.addOrder(order);
    this.updateBalancesAfterTrade(
      userId,
      baseAsset,
      quoteAsset,
      side,
      fills,
      executedQty
    );
    this.createDbTrades(fills, market, userId);
    this.updateDbOrders(order, executedQty, fills, market);
    this.publishWsDepthUpdates(fills, price, side, market);
    this.publishWsTrades(fills, userId, market);

    return { executedQty, fills, orderId: order.orderId };
  }

  private generateOrderId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private checkAndLockFunds({
    baseAsset,
    quoteAsset,
    side,
    userId,
    price,
    quantity,
  }: {
    baseAsset: string;
    quoteAsset: string;
    side: "buy" | "sell";
    userId: string;
    price: number;
    quantity: number;
  }) {
    if (side === "buy") {
      const requiredAmount = quantity * price;
      this.updateUserBalance(
        userId,
        quoteAsset,
        -requiredAmount,
        requiredAmount
      );
    } else {
      this.updateUserBalance(userId, baseAsset, -quantity, quantity);
    }
  }

  private updateBalancesAfterTrade(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    executedQty: number
  ) {
    fills.forEach((fill) => {
      const fillAmount = fill.qty * Number(fill.price);

      if (side === "buy") {
        // Maker (seller) gets quote asset, releases base asset
        this.updateUserBalance(fill.otherUserId, quoteAsset, fillAmount, 0);
        this.updateUserBalance(fill.otherUserId, baseAsset, 0, -fill.qty);

        // Taker (buyer) releases locked quote asset, gets base asset
        this.updateUserBalance(userId, quoteAsset, 0, -fillAmount);
        this.updateUserBalance(userId, baseAsset, fill.qty, 0);
      } else {
        // Maker (buyer) releases locked quote asset, gets base asset
        this.updateUserBalance(fill.otherUserId, quoteAsset, 0, -fillAmount);
        this.updateUserBalance(fill.otherUserId, baseAsset, fill.qty, 0);

        // Taker (seller) gets quote asset, releases locked base asset
        this.updateUserBalance(userId, quoteAsset, fillAmount, 0);
        this.updateUserBalance(userId, baseAsset, 0, -fill.qty);
      }
    });
  }

  private handleGetOpenOrders(
    data: Pick<GetOpenOrders, "data">["data"],
    clientId: string
  ) {
    const orderbook = this.getOrderbook(data.market);
    const openOrders = orderbook.getOpenOrders(data.userId);

    RedisManager.getInstance().sendToApi(clientId, {
      type: "OPEN_ORDERS",
      payload: openOrders,
    });
  }

  private handleOnRamp(data: Pick<OnRamp, "data">["data"]) {
    const { userId, amount } = data;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Invalid amount for onramp");
    }

    this.onRamp(userId, numericAmount);
  }

  private handleGetDepth(
    data: Pick<GetDepth, "data">["data"],
    clientId: string
  ) {
    const orderbook = this.getOrderbook(data.market);
    const depth = orderbook.getDepth();

    RedisManager.getInstance().sendToApi(clientId, {
      type: "DEPTH",
      payload: { market: data.market, ...depth },
    });
  }

  createDbTrades(fills: Fill[], market: string, userId: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: OrderBookEventEnum.TRADE_ADDED,
        data: {
          market: market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId === userId,
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
        },
      });
    });
  }

  updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string
  ) {
    RedisManager.getInstance().pushMessage({
      type: OrderBookEventEnum.ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        executedQty: executedQty,
        market: market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: OrderBookEventEnum.ORDER_UPDATE,
        data: {
          orderId: fill.makerOrderId,
          executedQty: fill.qty,
        },
      });
    });
  }

  publishWsTrades(fills: Fill[], userId: string, market: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId,
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }

  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.getOrderbook(market);
    const depth = orderbook.getDepth();
    const updatedBids = depth.bids.filter((x) => x[0] === price);
    const updatedAsks = depth.asks.filter((x) => x[0] === price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth",
      },
    });
  }

  publishWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string
  ) {
    const orderbook = this.getOrderbook(market);
    const depth = orderbook.getDepth();

    if (side === "buy") {
      const updatedAsks = depth.asks.filter((x) =>
        fills.map((f) => f.price.toString()).includes(x[0])
      );
      const updatedBid = depth.bids.find((x) => x[0] === price);

      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    } else {
      const updatedBids = depth.bids.filter((x) =>
        fills.map((f) => f.price.toString()).includes(x[0])
      );
      const updatedAsk = depth.asks.find((x) => x[0] === price);

      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk ? [updatedAsk] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }

  onRamp(userId: string, amount: number) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: amount,
          locked: 0,
        },
      });
    } else {
      if (!userBalance[BASE_CURRENCY]) {
        userBalance[BASE_CURRENCY] = {
          available: 0,
          locked: 0,
        };
      }
      userBalance[BASE_CURRENCY].available += amount;
    }

    // Notify about balance update
    RedisManager.getInstance().pushMessage({
      type: OrderBookEventEnum.BALANCE_UPDATE,
      data: {
        userId,
        asset: BASE_CURRENCY,
        available: this.balances.get(userId)?.[BASE_CURRENCY].available,
        locked: this.balances.get(userId)?.[BASE_CURRENCY].locked,
      },
    });
  }

  setBaseBalances() {
    const defaultBalance = {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    };

    // Initialize balances for default users
    ["1", "2", "5"].forEach((userId) => {
      this.balances.set(userId, { ...defaultBalance });
    });
  }

  addOrderbook(orderbook: Orderbook) {
    const existingOrderbook = this.orderbooks.find(
      (ob) => ob.ticker() === orderbook.ticker()
    );
    if (existingOrderbook) {
      throw new Error(`Orderbook for ${orderbook.ticker()} already exists`);
    }
    this.orderbooks.push(orderbook);
  }

  public getUserBalance(
    userId: string,
    asset: string
  ): { available: number; locked: number } {
    const userBalance = this.balances.get(userId);
    if (!userBalance || !userBalance[asset]) {
      return { available: 0, locked: 0 };
    }
    return userBalance[asset];
  }

  public getOrderbooks(): string[] {
    return this.orderbooks.map((ob) => ob.ticker());
  }

  public cleanup() {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }

  // Helper method to validate numeric inputs
  private validateNumericInput(
    value: string | number,
    fieldName: string
  ): number {
    const numericValue = typeof value === "string" ? Number(value) : value;
    if (isNaN(numericValue) || numericValue <= 0) {
      throw new Error(`Invalid ${fieldName}: must be a positive number`);
    }
    return numericValue;
  }

  // Helper method to validate user existence
  private validateUser(userId: string): UserBalance {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      throw new Error(`User ${userId} not found`);
    }
    return userBalance;
  }

  // Helper method to ensure asset balance exists
  private ensureAssetBalance(userBalance: UserBalance, asset: string) {
    if (!userBalance[asset]) {
      userBalance[asset] = {
        available: 0,
        locked: 0,
      };
    }
    return userBalance[asset];
  }

  // Helper method to format trade data
  private formatTradeData(fill: Fill, market: string): any {
    return {
      market,
      id: fill.tradeId.toString(),
      price: fill.price,
      quantity: fill.qty.toString(),
      quoteQuantity: (fill.qty * Number(fill.price)).toString(),
      timestamp: Date.now(),
    };
  }

  // Method to get market statistics
  public getMarketStatistics(market: string) {
    const orderbook = this.getOrderbook(market);
    const depth = orderbook.getDepth();

    return {
      lastPrice: orderbook.getCurrentPrice(),
      bestBid: depth.bids[0]?.[0] || null,
      bestAsk: depth.asks[0]?.[0] || null,
      volume24h: orderbook.get24HourVolume(),
      priceChange24h: orderbook.get24HourPriceChange(),
    };
  }

  // Method to get user's open orders across all markets
  public getUserOpenOrders(userId: string): any[] {
    return this.orderbooks.flatMap((orderbook) =>
      orderbook.getOpenOrders(userId).map((order) => ({
        ...order,
        market: orderbook.ticker(),
      }))
    );
  }

  // Method to handle system shutdown
  public shutdown() {
    try {
      this.cleanup();
      this.saveSnapshot();
      console.log("Engine shutdown completed successfully");
    } catch (error) {
      console.error("Error during engine shutdown:", error);
      throw error;
    }
  }
}
