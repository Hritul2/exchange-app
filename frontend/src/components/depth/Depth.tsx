"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTicker } from "@/actions/getTicker";
import { getDepth } from "@/actions/getDepth";
import AskTable from "@/components/depth/AskTable";
import BidTable from "@/components/depth/BidTable";

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
