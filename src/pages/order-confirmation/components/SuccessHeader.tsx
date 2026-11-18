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
    <div className="bg-white border border-line p-6 md:p-10 text-center">
      <div className="h-16 w-16 rounded-full bg-success/10 grid place-items-center mx-auto">
        <CheckCircle2 className="h-9 w-9 text-success" />
      </div>
      <h1 className="font-display-tight text-3xl md:text-4xl font-bold mt-4">
        Order placed successfully!
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto">
        Thanks {firstName}, we've received your order. We'll call you on{" "}
        <span className="font-semibold text-ink">{order.address.phone}</span> to confirm delivery.
      </p>

      <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 bg-muted">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Order #</span>
        <span className="font-display font-bold text-lg">{order.orderNumber}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/shop">
            Continue shopping <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button variant="outline" size="lg" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print receipt
        </Button>
      </div>
    </div>
  );
}
