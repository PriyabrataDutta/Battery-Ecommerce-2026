/**
 * PaymentStep — Step 3 of checkout.
 *
 * Shows the methods switched on in Admin → Settings → Payment. "Pay online"
 * redirects to Cashfree's hosted checkout after the order is created
 * (see `placeOrder` in ../index.tsx).
 */
import { CreditCard } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_OPTIONS } from "../lib/constants";
import type { PaymentId } from "../lib/types";

export const PaymentStep = ({
  payment,
  setPayment,
  available,
}: {
  payment: PaymentId;
  setPayment: (p: PaymentId) => void;
  available: PaymentId[] | undefined;
}) => {
  const options = PAYMENT_OPTIONS.filter((p) => available?.includes(p.id));
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10">
          <CreditCard className="h-5 w-5 text-primary" />
        </span>
        <h2 className="font-display-tight text-2xl font-bold text-ink">Payment method</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        {available === undefined
          ? "Loading payment options…"
          : options.length === 0
            ? "Ordering is paused right now. Please call us to place your order."
            : "Choose how you'd like to pay."}
      </p>

      <RadioGroup
        value={payment}
        onValueChange={(v) => setPayment(v as PaymentId)}
        className="mt-6 space-y-3"
      >
        {options.map((p) => {
          const Icon = p.icon;
          const active = payment === p.id;
          return (
            <label
              key={p.id}
              htmlFor={`pay-${p.id}`}
              className={[
                "flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all",
                active ? "border-primary bg-primary/[0.04] shadow-card" : "border-line bg-card hover:border-ink/30",
              ].join(" ")}
            >
              <RadioGroupItem id={`pay-${p.id}`} value={p.id} />
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-primary text-white" : "bg-muted text-ink-soft"}`}><Icon className="h-5 w-5" /></span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-ink">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.hint}</div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
};
