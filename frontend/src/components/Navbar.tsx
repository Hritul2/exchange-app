"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RadiobuttonIcon } from "@radix-ui/react-icons";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-500">
      <div className="flex items-center space-x-8">
        <Link
          href="/"
          className="text-xl font-semibold text-secondary hover:text-secondary/80 flex justify-between items-center gap-4"
        >
          <RadiobuttonIcon height={30} width={30} />
          Exchange
        </Link>

        <nav className="flex items-center space-x-8">
          <Link
            href="/markets"
            className={`text-sm ${
              pathname.startsWith("/markets")
                ? "text-secondary"
                : "text-slate-50/60"
            } hover:text-secondary/80`}
          >
            Markets
          </Link>
          <Link
            href="/trade/SOL_USDC"
            className={`text-sm ${
              pathname.startsWith("/trade")
                ? "text-secondary"
                : "text-slate-50/60"
            } hover:text-secondary/80`}
          >
            Trade
          </Link>
        </nav>
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="secondary">Sign up</Button>
        <Button variant={"destructive"}>Sign in</Button>
      </div>
    </div>
  );
};

export default Navbar;
