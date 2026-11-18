/**
 * PaymentStatusBanner — online (Cashfree) orders only.
 *
 * Asks the server to confirm the payment with Cashfree (the browser's word is
 * never trusted), polls briefly while Cashfree finishes, and offers a retry
 * while the payment window is still open.
 */
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyCashfreePayment } from "@/api/payments";
import { payOnline } from "@/lib/cashfree";
import { toast } from "sonner";

type State = "checking" | "paid" | "pending" | "closed";

export const PaymentStatusBanner = ({ orderNumber }: { orderNumber: string }) => {
  const [state, setState] = useState<State>("checking");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let tries = 0;
    const check = async () => {
      try {
        const r = await verifyCashfreePayment(orderNumber);
        if (cancelled) return;
        if (r.payment_status === "paid") return setState("paid");
        if (r.status === "cancelled" || r.payment_status === "failed" || ["expired", "terminated"].includes(r.state)) {
          return setState("closed");
        }
        setState("pending");
        // Cashfree can take a few seconds to settle after the redirect back.
        if (++tries < 5) setTimeout(check, 3000);
      } catch {
        if (!cancelled) setState("pending");
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const retry = async () => {
    setPaying(true);
    try {
      await payOnline(orderNumber);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open the payment page.");
      setPaying(false);
    }
  };

  if (state === "checking") {
    return (
      <div className="mb-6 flex items-center gap-3 border border-line bg-white p-4 text-sm">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> Confirming your payment with Cashfree…
      </div>
    );
  }
  if (state === "paid") {
    return (
      <div className="mb-6 flex items-center gap-3 border border-success/30 bg-success/10 p-4 text-sm">
        <CheckCircle2 className="h-5 w-5 text-success" /> <span className="font-semibold">Payment received.</span> Thank you!
      </div>
    );
  }
  if (state === "closed") {
    return (
      <div className="mb-6 flex items-center gap-3 border border-destructive/30 bg-destructive/10 p-4 text-sm">
        <XCircle className="h-5 w-5 text-destructive" />
        <span>
          <span className="font-semibold">Payment not completed.</span> The payment window has closed and this order was cancelled. Please place the order again.
        </span>
      </div>
    );
  }
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 border border-warning/40 bg-warning/10 p-4 text-sm">
      <Clock className="h-5 w-5 text-warning shrink-0" />
      <span className="flex-1">
        <span className="font-semibold">Payment pending.</span> Your order is saved and stock is held for 30 minutes. Complete the payment to confirm it.
      </span>
      <Button onClick={retry} disabled={paying}>
        {paying ? "Opening…" : "Complete payment"}
      </Button>
    </div>
  );
};
