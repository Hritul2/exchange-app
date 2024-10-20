import fs from "fs";
import z from "zod";
import { RedisManager } from "./RedisManager";
import { OrderBookEventEnum } from "@/utils/types/events.type";
import { MessageFromApi } from "@/utils/types/messageFromApi.type";
import { ActionTypesEnum } from "@/utils/types/actionTypes.type";
import { Order, Fill, Orderbook } from "./Orderbook";

// constants
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

  constructor() {
    let snapshot = null;
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("NO SNAPSHOTS FOUND");
    }
    if (snapshot) {
      const snapshotObject = JSON.parse(snapshot.toString());
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
    } else {
      this.orderbooks = [new Orderbook("TATA", [], [], 0, 0)];
      this.setBaseBalances();
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  saveSnapshot() {
    const snapshotObject = {
      orderbooks: this.orderbooks.map((o) => o.getSnapshot()),
      balances: Array.from(this.balances.entries()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotObject));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    const { type, data } = message;
    switch (type) {
      case ActionTypesEnum.CREATE_ORDER:
        try {
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
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
            },
          });
        }
        break;
      case ActionTypesEnum.CANCEL_ORDER:
        try {
          const orderId = data.orderId;
          const cancelMarket = data.market;
          const cancelOrderbook = this.orderbooks.find(
            (o) => o.ticker() === cancelMarket
          );
          const quoteAsset = cancelMarket.split("_")[1]; // TATA_INR => [TATA, INR] => INR
          if (!cancelOrderbook) {
            throw new Error("Orderbook not found");
          }
          const order =
            cancelOrderbook.asks.find((o) => o.orderId === orderId) ||
            cancelOrderbook.bids.find((o) => o.orderId === orderId);
          if (!order) {
            console.log("Order not found");
            throw new Error("Order not found");
          }

          if (order.side === "buy") {
            const price = cancelOrderbook.cancelBid(order);
            const leftQuantity = (order.quantity - order.filled) * order.price;
            const userBalance = this.balances.get(order.userId);
            if (userBalance) {
              userBalance[BASE_CURRENCY].available += leftQuantity;
              userBalance[BASE_CURRENCY].locked -= leftQuantity;
            } else {
              throw new Error("User not found");
            }
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          } else {
            const price = cancelOrderbook.cancelAsk(order);
            const leftQuantity = order.quantity - order.filled;
            const userBalance = this.balances.get(order.userId);
            if (userBalance) {
              userBalance[quoteAsset].available += leftQuantity;
              userBalance[quoteAsset].locked -= leftQuantity;
            } else {
              throw new Error("User not found");
            }
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              executedQty: 0,
              remainingQty: 0,
            },
          });
        } catch (e) {
          console.log("Error while cancelling order");
          console.log(e);
        }
        break;
      case ActionTypesEnum.GET_OPEN_ORDERS:
        try {
          const openOrderbook = this.orderbooks.find(
            (o) => o.ticker() === data.market
          );
          if (!openOrderbook) {
            throw new Error("Orderbook not found");
          }
          const openOrders = openOrderbook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (e) {
          console.log(e);
        }
        break;
      case ActionTypesEnum.ON_RAMP:
        const userId = data.userId;
        const amount = Number(data.amount);
        this.onRamp(userId, amount);
        break;
      case ActionTypesEnum.GET_DEPTH:
        try {
          const market = data.market;
          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("Orderbook not found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: { market, ...orderbook.getDepth() },
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              market: data.market,
              bids: [],
              asks: [],
            },
          });
        }
        break;
    }
  }

  addOrderbook(orderbook: Orderbook) {
    this.orderbooks.push(orderbook);
  }
  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    if (!orderbook) {
      throw new Error("Orderbook not found");
    }
    this.checkAndLockFunds({
      baseAsset,
      quoteAsset,
      side,
      userId,
      asset: baseAsset,
      price,
      quantity,
    });

    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      filled: 0,
      side,
      userId,
    };
    const { fills, executedQty } = orderbook.addOrder(order);
    this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);
    this.createDbTrades(fills, market, userId);
    this.updateDbOrders(order, executedQty, fills, market);
    this.publisWsDepthUpdates(fills, price, side, market);
    this.publishWsTrades(fills, userId, market);
    return { executedQty, fills, orderId: order.orderId };
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

  createDbTrades(fills: Fill[], market: string, userId: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: OrderBookEventEnum.TRADE_ADDED,
        data: {
          market: market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId === userId, // TODO: Is this right?
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
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
          m: fill.otherUserId === userId, // TODO: Is this right?
          p: fill.price,
          q: fill.qty.toString(),
          s: market,
        },
      });
    });
  }

  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    const updatedBids = depth?.bids.filter((x) => x[0] === price);
    const updatedAsks = depth?.asks.filter((x) => x[0] === price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth",
      },
    });
  }

  publisWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    if (side === "buy") {
      const updatedAsks = depth?.asks.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );
      const updatedBid = depth?.bids.find((x) => x[0] === price);
      console.log("publish ws depth updates");
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    }
    if (side === "sell") {
      const updatedBids = depth?.bids.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );
      const updatedAsk = depth?.asks.find((x) => x[0] === price);
      console.log("publish ws depth updates");
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

  updateBalance(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    executedQty: number
  ) {
    if (side === "buy") {
      fills.forEach((fill) => {
        // Update quote asset balance
        const otherUserBalances = this.balances.get(fill.otherUserId);
        if (!otherUserBalances) {
          throw new Error("User not found");
        }
        otherUserBalances[quoteAsset].available =
          otherUserBalances[quoteAsset].available +
          fill.qty * Number(fill.price);

        const userBalances = this.balances.get(userId);
        if (!userBalances) {
          throw new Error("User not found");
        }
        userBalances[quoteAsset].locked =
          userBalances[quoteAsset].locked - fill.qty * Number(fill.price);

        // Update base asset balance

        otherUserBalances[baseAsset].locked =
          otherUserBalances[baseAsset].locked - fill.qty;

        userBalances[baseAsset].available =
          userBalances[baseAsset].available + fill.qty;
      });
    } else {
      fills.forEach((fill) => {
        // Update quote asset balance
        const otherUserBalances = this.balances.get(fill.otherUserId);
        if (!otherUserBalances) {
          throw new Error("User not found");
        }
        otherUserBalances[quoteAsset].locked =
          otherUserBalances[quoteAsset].locked - fill.qty * Number(fill.price);

        const userBalances = this.balances.get(userId);
        if (!userBalances) {
          throw new Error("User not found");
        }
        userBalances[quoteAsset].available =
          userBalances[quoteAsset].available + fill.qty * Number(fill.price);

        // Update base asset balance

        otherUserBalances[baseAsset].available =
          otherUserBalances[baseAsset].available + fill.qty;

        userBalances[baseAsset].locked =
          userBalances[baseAsset].locked - fill.qty;
      });
    }
  }

  checkAndLockFunds({
    baseAsset,
    quoteAsset,
    side,
    userId,
    asset,
    price,
    quantity,
  }: {
    baseAsset: string;
    quoteAsset: string;
    side: "buy" | "sell";
    userId: string;
    asset: string;
    price: string;
    quantity: string;
  }) {
    if (side === "buy") {
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) <
        Number(quantity) * Number(price)
      ) {
        throw new Error("Insufficient balance");
      }
      const userBalances = this.balances.get(userId);
      if (!userBalances) {
        throw new Error("User not found");
      }
      userBalances[quoteAsset].available =
        userBalances[quoteAsset].available - Number(quantity) * Number(price);
      userBalances[quoteAsset].locked =
        userBalances[quoteAsset].locked + Number(quantity) * Number(price);
    } else {
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        throw new Error("Insufficient funds");
      }
      const userBalances = this.balances.get(userId);
      if (!userBalances) {
        throw new Error("User not found");
      }
      userBalances[baseAsset].available =
        userBalances[baseAsset].available - Number(quantity);
      userBalances[baseAsset].locked =
        userBalances[baseAsset].locked + Number(quantity);
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
      userBalance[BASE_CURRENCY].available += amount;
    }
  }

  setBaseBalances() {
    this.balances.set("1", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("2", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });

    this.balances.set("5", {
      [BASE_CURRENCY]: {
        available: 10000000,
        locked: 0,
      },
      TATA: {
        available: 10000000,
        locked: 0,
      },
    });
  }
}
