"use client";

import { useEffect, useRef } from "react";
import OrderTable from "@/components/depth/OrderTable";
import { calculateAsksTotal } from "@/utils/orderCalculations";

type OrderData = [string, string];

export default function AskTable({ asks }: { asks: OrderData[] }) {
  const relevantAsks = asks.slice(0, 15).reverse();
  const asksWithTotal = calculateAsksTotal(relevantAsks);
  asksWithTotal.reverse();
  const maxTotal = asksWithTotal[0]?.[2] || 0;

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [asks]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto">
      <OrderTable orders={asksWithTotal} maxTotal={maxTotal} type="ask" />
    </div>
  );
}
