"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function SwapUI({ market }: { market: string }) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("limit");

  return (
    <Card className="w-full max-w-md">
      <Tabs defaultValue="buy" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
          >
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-red-100 data-[state=active]:text-red-700"
          >
            Sell
          </TabsTrigger>
        </TabsList>
        <CardContent className="pt-6">
          <div className="flex justify-between mb-4">
            <Button
              variant={type === "limit" ? "default" : "outline"}
              onClick={() => setType("limit")}
            >
              Limit
            </Button>
            <Button
              variant={type === "market" ? "default" : "outline"}
              onClick={() => setType("market")}
            >
              Market
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Balance</span>
              <span>36.94 USDC</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  defaultValue="134.38"
                />
                <Avatar className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2">
                  <AvatarImage src="/usdc.webp" alt="USDC" />
                  <AvatarFallback>USDC</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="relative">
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Avatar className="h-6 w-6 absolute right-2 top-1/2 transform -translate-y-1/2">
                  <AvatarImage src="/sol.webp" alt="SOL" />
                  <AvatarFallback>SOL</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                ≈ 0.00 USDC
              </div>
            </div>
            <div className="flex justify-between gap-2">
              {["25%", "50%", "75%", "Max"].map((percent) => (
                <Button
                  key={percent}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(percent)}
                >
                  {percent}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full bg-green-500 hover:bg-green-600">
            Buy
          </Button>
          <div className="flex justify-between w-full">
            <div className="flex items-center space-x-2">
              <Switch id="post-only" />
              <Label htmlFor="post-only">Post Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="ioc" />
              <Label htmlFor="ioc">IOC</Label>
            </div>
          </div>
        </CardFooter>
      </Tabs>
    </Card>
  );
}
