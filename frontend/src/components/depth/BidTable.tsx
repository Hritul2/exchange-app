"use client";

import OrderTable from "./OrderTable";
import { calculateBidsTotal } from "@/utils/orderCalculations";

type OrderData = [string, string];

export default function BidTable({ bids }: { bids: OrderData[] }) {
  const relevantBids = bids.slice(0, 15);
  const bidsWithTotal = calculateBidsTotal(relevantBids);
  const maxTotal = bidsWithTotal[bidsWithTotal.length - 1]?.[2] || 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <OrderTable orders={bidsWithTotal} maxTotal={maxTotal} type="bid" />
    </div>
  );
}
