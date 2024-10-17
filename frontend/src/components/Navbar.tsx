"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDot as Radio } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between p-4 border-b border-border">
      <div className="flex items-center space-x-8">
        <Link
          href="/"
          className="text-xl font-semibold text-primary hover:text-primary-foreground flex justify-between items-center gap-4"
        >
          <Radio height={30} width={30} />
          Exchange
        </Link>

        <nav className="flex items-center justify-center space-x-8">
          <Link
            href="/markets"
            className={`text-sm ${
              pathname.startsWith("/markets")
                ? "text-primary"
                : "text-muted-foreground"
            } hover:text-primary/80`}
          >
            Markets
          </Link>
          <Link
            href="/trade/SOL_USDC"
            className={`text-sm ${
              pathname.startsWith("/trade")
                ? "text-primary"
                : "text-muted-foreground"
            } hover:text-primary/80`}
          >
            Trade
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="secondary">Sign up</Button>
        <Button variant="destructive">Sign in</Button>
      </div>
    </div>
  );
};

export default Navbar;
