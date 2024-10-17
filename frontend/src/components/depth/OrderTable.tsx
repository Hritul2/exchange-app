"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OrderTable({
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
