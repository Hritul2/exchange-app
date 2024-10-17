"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTicker } from "@/actions/getTicker";
import { getDepth } from "@/actions/getDepth";

type OrderData = [string, string];

export default function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<OrderData[]>([]);
  const [asks, setAsks] = useState<OrderData[]>([]);
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    getTicker(market).then((t) => setPrice(t.lastPrice));
  }, [market]);

  return (
    <div className="relative h-full overflow-hidden">
      <Card className="w-full h-full sticky top-0 bg-background text-primary">
        <CardHeader>
          <CardTitle>Order Book</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-full">
          <AskTable asks={asks} />

          <div className="text-center font-bold my-2">{price}</div>

          <BidTable bids={bids} />
        </CardContent>
      </Card>
    </div>
  );
}

function AskTable({ asks }: { asks: OrderData[] }) {
  const relevantAsks = asks.slice(0, 15).reverse();
  const asksWithTotal = calculateAsksTotal(relevantAsks);
  asksWithTotal.reverse();
  const maxTotal = asksWithTotal[0]?.[2] || 0;

  // Ref to the container div to control scrolling
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [asks]); // Trigger scrolling when asks are updated

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <OrderTable orders={asksWithTotal} maxTotal={maxTotal} type="ask" />
    </div>
  );
}

function BidTable({ bids }: { bids: OrderData[] }) {
  const relevantBids = bids.slice(0, 15);
  const bidsWithTotal = calculateBidsTotal(relevantBids);
  const maxTotal = bidsWithTotal[bidsWithTotal.length - 1]?.[2] || 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <OrderTable orders={bidsWithTotal} maxTotal={maxTotal} type="bid" />;
    </div>
  );
}

function OrderTable({
  orders,
  maxTotal,
  type,
}: {
  orders: [string, string, number][];
  maxTotal: number;
  type: "ask" | "bid";
}) {
  const bgColor = type === "ask" ? "bg-red-100" : "bg-green-100";
  const textColor = type === "ask" ? "text-red-600" : "text-green-600";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/3">Price</TableHead>
          <TableHead className="w-1/3 text-right">Size</TableHead>
          <TableHead className="w-1/3 text-right">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map(([price, quantity, total]) => (
          <TableRow key={price} className="relative">
            <TableCell className={`${textColor} font-medium`}>
              {price}
            </TableCell>
            <TableCell className="text-right">{quantity}</TableCell>
            <TableCell className="text-right">{total.toFixed(2)}</TableCell>
            <div
              className={`absolute top-0 right-0 h-full ${bgColor} transition-all duration-300 ease-in-out`}
              style={{ width: `${(total / maxTotal) * 100}%`, opacity: 0.3 }}
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function calculateBidsTotal(orders: OrderData[]): [string, string, number][] {
  let currentTotal = 0;
  return orders.map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
}

function calculateAsksTotal(asks: OrderData[]): [string, string, number][] {
  let currentTotal = 0;
  return asks.reverse().map(([price, quantity]) => {
    currentTotal += Number(quantity);
    return [price, quantity, currentTotal];
  });
}
