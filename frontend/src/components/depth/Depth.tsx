"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTicker } from "@/actions/getTicker";
import { getDepth } from "@/actions/getDepth";
import AskTable from "@/components/depth/AskTable";
import BidTable from "@/components/depth/BidTable";
import { SocketManager } from "@/utils/SocketManager";
import { SocketManagerType } from "@/utils/constants";
import { getTrades } from "@/actions/getTrades";

type OrderData = [string, string];

export default function Depth({ market }: { market: string }) {
  const [bids, setBids] = useState<OrderData[]>([]);
  const [asks, setAsks] = useState<OrderData[]>([]);
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    SocketManager.getInstance().registerCallback(
      SocketManagerType.Depth,
      (data: any) => {
        setBids((originalBids) => {
          const bidsAfterUpdate = [...(originalBids || [])];

          for (let i = 0; i < bidsAfterUpdate.length; i++) {
            for (let j = 0; j < data.bids.length; j++) {
              if (bidsAfterUpdate[i][0] === data.bids[j][0]) {
                bidsAfterUpdate[i][1] = data.bids[j][1];
                break;
              }
            }
          }
          return bidsAfterUpdate;
        });

        setAsks((originalAsks) => {
          const asksAfterUpdate = [...(originalAsks || [])];

          for (let i = 0; i < asksAfterUpdate.length; i++) {
            for (let j = 0; j < data.asks.length; j++) {
              if (asksAfterUpdate[i][0] === data.asks[j][0]) {
                asksAfterUpdate[i][1] = data.asks[j][1];
                break;
              }
            }
          }
          return asksAfterUpdate;
        });
      },
      `DEPTH-${market}`
    );

    SocketManager.getInstance().sendMessage({
      method: "SUBSCRIBE",
      params: [`depth.${market}`],
    });

    getDepth(market).then((d) => {
      setBids(d.bids.reverse());
      setAsks(d.asks);
    });

    getTicker(market).then((t) => setPrice(t.lastPrice));
    getTrades(market).then((t) => setPrice(t[0].price));
    // getKlines(market, "1h", 1640099200, 1640100800).then(t => setPrice(t[0].close));
    return () => {
      SocketManager.getInstance().sendMessage({
        method: "UNSUBSCRIBE",
        params: [`depth.200ms.${market}`],
      });
      SocketManager.getInstance().deRegisterCallback(
        SocketManagerType.Depth,
        `DEPTH-${market}`
      );
    };
  }, []);

  return (
    <div className="relative h-full overflow-hidden">
      <Card className="w-full h-full  bg-background text-primary rounded-none border-none">
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
