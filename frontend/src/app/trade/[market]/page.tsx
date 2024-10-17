"use client";

import { useParams } from "next/navigation";
import MarketBar from "@/components/MarketBar";
import SwapUI from "@/components/swap-ui";
import TradeView from "@/components/TradeView";
import Depth from "@/components/depth/Depth";

export default function TradingPage() {
  const { market } = useParams<{ market: string }>();

  return (
    <div className=" flex flex-col md:flex-row h-full gap-2 my-2">
      <div className="flex-1 flex flex-col gap-4 border-2 border-border ">
        <MarketBar market={market} />
        <div className="flex flex-col md:flex-row gap-4 border-border px-2">
          <TradeView market={market} />
          <div className="w-1/4 h-[520px] border-l-2 border-border">
            <Depth market={market} />
          </div>
        </div>
      </div>

      <div className=" border border-border flex justify-center ">
        <SwapUI market={market} />
      </div>
    </div>
  );
}
