/**
 * PaymentStep — Step 3 of checkout.
 *
 * Cash on Delivery only for now. When Cashfree is wired, add it to
 * PAYMENT_OPTIONS and to place_order, and open its checkout from
 * `placeOrder` in ../index.tsx.
 */
import { CreditCard } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PAYMENT_OPTIONS } from "../lib/constants";
import type { PaymentId } from "../lib/types";

export const PaymentStep = ({
  payment,
  setPayment,
}: {
  payment: PaymentId;
  setPayment: (p: PaymentId) => void;
}) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Payment method</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Pay when your battery is delivered. Online payment is coming soon.
      </p>

      <RadioGroup
        value={payment}
        onValueChange={(v) => setPayment(v as PaymentId)}
        className="mt-6 space-y-3"
      >
        {PAYMENT_OPTIONS.map((p) => {
          const Icon = p.icon;
          const active = payment === p.id;
          return (
            <label
              key={p.id}
              htmlFor={`pay-${p.id}`}
              className={[
                "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                active ? "border-primary bg-primary/5" : "border-line hover:border-ink-soft",
              ].join(" ")}
            >
              <RadioGroupItem id={`pay-${p.id}`} value={p.id} />
              <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-ink-soft"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold">{p.label}</div>
                <div className="text-xs text-muted-foreground">{p.hint}</div>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
};
