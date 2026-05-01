/**
 * PaymentStep — Step 3 of checkout.
 *
 * Demo only — none of the inputs (card number, UPI ID) are sent anywhere.
 * To wire a real PSP later, replace the inline demo fields with the PSP's
 * SDK and call it from `placeOrder` in ../index.tsx.
 */
import { CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field } from "./Field";
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
        This is a demo checkout. No real payment is taken.
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

      {payment === "card" && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4 p-4 border border-dashed border-line bg-muted/30">
          <Field label="Card number" className="sm:col-span-2">
            <Input placeholder="1234 5678 9012 3456" inputMode="numeric" maxLength={19} />
          </Field>
          <Field label="Name on card">
            <Input placeholder="As printed on card" />
          </Field>
          <Field label="Expiry">
            <Input placeholder="MM / YY" inputMode="numeric" maxLength={7} />
          </Field>
          <Field label="CVV">
            <Input placeholder="•••" inputMode="numeric" maxLength={4} />
          </Field>
          <p className="sm:col-span-2 text-[11px] text-muted-foreground">
            Demo only — card data is not transmitted or stored.
          </p>
        </div>
      )}

      {payment === "upi" && (
        <div className="mt-6 p-4 border border-dashed border-line bg-muted/30">
          <Field label="UPI ID">
            <Input placeholder="yourname@okhdfcbank" />
          </Field>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Demo only — no UPI request will be sent.
          </p>
        </div>
      )}
    </div>
  );
};
