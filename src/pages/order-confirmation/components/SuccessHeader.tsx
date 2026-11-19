import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Printer } from "lucide-react";
import type { SavedOrder } from "../lib/types";

/**
 * SuccessHeader
 * --------------------------------------------------------------
 * Hero block: green check, thank-you copy, order number, and the
 * primary "Continue shopping" / "Print receipt" CTAs.
 */
export function SuccessHeader({ order }: { order: SavedOrder }) {
  const firstName = order.address.fullName.split(" ")[0];
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-white p-6 md:p-12 text-center">
      <div className="absolute inset-0 bg-dots opacity-60" aria-hidden />
      <div className="relative">
      <div className="h-16 w-16 rounded-full bg-success grid place-items-center mx-auto shadow-[0_0_0_10px_hsl(var(--success)/0.15)]">
        <CheckCircle2 className="h-9 w-9 text-white" />
      </div>
      <h1 className="font-display-tight text-3xl md:text-5xl font-bold mt-5">
        Order placed successfully!
      </h1>
      <p className="text-white/70 mt-3 max-w-md mx-auto">
        Thanks {firstName}, we've received your order. We'll call you on{" "}
        <span className="font-semibold text-white">{order.address.phone}</span> to confirm delivery.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2.5">
        <span className="text-xs font-medium text-white/60">Order #</span>
        <span className="font-display font-bold text-lg text-volt">{order.orderNumber}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/shop">
            Continue shopping <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-ink" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print receipt
        </Button>
      </div>
      </div>
    </div>
  );
}
