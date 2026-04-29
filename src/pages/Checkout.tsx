import { useMemo, useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useCart, lineKey, lineUnitPrice } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatINR } from "@/lib/format";
import {
  Check,
  ChevronLeft,
  CreditCard,
  Truck,
  MapPin,
  ShieldCheck,
  Wallet,
  Banknote,
  Smartphone,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

type Step = 0 | 1 | 2 | 3;

interface Address {
  fullName: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
}

const EMPTY_ADDRESS: Address = {
  fullName: "",
  phone: "",
  email: "",
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
};

type DeliveryId = "standard" | "express" | "installation";
const DELIVERY_OPTIONS: {
  id: DeliveryId;
  label: string;
  eta: string;
  price: number;
  icon: typeof Truck;
}[] = [
  { id: "standard", label: "Standard Doorstep Delivery", eta: "3–5 business days", price: 0, icon: Truck },
  { id: "express", label: "Express Delivery", eta: "1–2 business days", price: 299, icon: Truck },
  {
    id: "installation",
    label: "Doorstep Installation + Old Battery Pickup",
    eta: "2–4 business days",
    price: 499,
    icon: ShieldCheck,
  },
];

type PaymentId = "upi" | "card" | "netbanking" | "cod";
const PAYMENT_OPTIONS: {
  id: PaymentId;
  label: string;
  hint: string;
  icon: typeof Wallet;
}[] = [
  { id: "upi", label: "UPI", hint: "Pay via Google Pay, PhonePe, Paytm, BHIM", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, Rupay, Amex", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", hint: "All major Indian banks", icon: Wallet },
  { id: "cod", label: "Cash on Delivery", hint: "Pay in cash when your battery arrives", icon: Banknote },
];

const STEPS = ["Address", "Delivery", "Payment", "Review"] as const;

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [step, setStep] = useState<Step>(0);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<DeliveryId>("standard");
  const [payment, setPayment] = useState<PaymentId>("upi");
  const [submitting, setSubmitting] = useState(false);

  const deliveryOption = useMemo(
    () => DELIVERY_OPTIONS.find((o) => o.id === delivery)!,
    [delivery],
  );

  // GST 18% on goods only (typical for batteries in India). Frontend mockup math.
  const tax = useMemo(() => Math.round(subtotal * 0.18), [subtotal]);
  const total = subtotal + tax + deliveryOption.price;

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const validateAddress = (a: Address) => {
    if (!a.fullName.trim()) return "Full name is required";
    if (!/^\d{10}$/.test(a.phone.replace(/\D/g, ""))) return "Enter a valid 10-digit phone number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) return "Enter a valid email";
    if (!a.line1.trim()) return "Address line 1 is required";
    if (!a.city.trim()) return "City is required";
    if (!a.state.trim()) return "State is required";
    if (!/^\d{6}$/.test(a.pincode)) return "Enter a valid 6-digit PIN code";
    return null;
  };

  const goNext = () => {
    if (step === 0) {
      const err = validateAddress(address);
      if (err) {
        toast.error(err);
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    setSubmitting(true);
    // Frontend-only mockup — simulate order placement
    await new Promise((r) => setTimeout(r, 1200));
    const orderNumber = `KCH-${Date.now().toString().slice(-8)}`;
    const order = {
      orderNumber,
      placedAt: new Date().toISOString(),
      items: items.map((it) => ({
        ...it,
        unitPrice: lineUnitPrice(it),
        lineTotal: lineUnitPrice(it) * it.qty,
      })),
      address,
      delivery: deliveryOption,
      payment: PAYMENT_OPTIONS.find((p) => p.id === payment)!,
      totals: { subtotal, tax, shipping: deliveryOption.price, total },
    };
    sessionStorage.setItem("kachi_last_order", JSON.stringify(order));
    clear();
    setSubmitting(false);
    navigate("/order-confirmation", { replace: true });
  };

  return (
    <div className="container-x py-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Link to="/cart" className="inline-flex items-center gap-1 hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to cart
        </Link>
      </div>
      <h1 className="font-display-tight text-3xl md:text-4xl font-bold">Checkout</h1>

      {/* Stepper */}
      <ol className="mt-6 grid grid-cols-4 gap-2">
        {STEPS.map((label, i) => {
          const active = i === step;
          const done = i < step;
          return (
            <li key={label} className="flex items-center gap-2 min-w-0">
              <div
                className={[
                  "h-8 w-8 rounded-full grid place-items-center text-xs font-semibold shrink-0",
                  done
                    ? "bg-primary text-white"
                    : active
                    ? "bg-ink text-white"
                    : "bg-muted text-ink-soft",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={[
                  "text-xs md:text-sm font-display font-semibold uppercase tracking-wide truncate",
                  active ? "text-ink" : done ? "text-ink" : "text-muted-foreground",
                ].join(" ")}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
        {/* Step content */}
        <section className="bg-white border border-line p-5 md:p-7">
          {step === 0 && (
            <AddressStep address={address} setAddress={setAddress} />
          )}
          {step === 1 && (
            <DeliveryStep delivery={delivery} setDelivery={setDelivery} />
          )}
          {step === 2 && (
            <PaymentStep payment={payment} setPayment={setPayment} />
          )}
          {step === 3 && (
            <ReviewStep
              items={items}
              address={address}
              delivery={deliveryOption}
              payment={PAYMENT_OPTIONS.find((p) => p.id === payment)!}
            />
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="min-w-[110px]"
            >
              Back
            </Button>
            {step < 3 ? (
              <Button onClick={goNext} size="lg" className="min-w-[140px]">
                Continue
              </Button>
            ) : (
              <Button onClick={placeOrder} size="lg" disabled={submitting} className="min-w-[180px]">
                {submitting ? "Placing order…" : `Place order · ${formatINR(total)}`}
              </Button>
            )}
          </div>
        </section>

        {/* Order summary sidebar */}
        <aside className="bg-white border border-line p-6 h-fit lg:sticky lg:top-32">
          <h2 className="font-display font-bold text-lg uppercase tracking-wide">Order Summary</h2>

          <ul className="mt-4 divide-y divide-line">
            {items.map((it) => {
              const k = lineKey(it);
              const unit = lineUnitPrice(it);
              return (
                <li key={k} className="py-3 flex gap-3">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.name}
                      className="h-14 w-14 object-cover bg-muted shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-display font-semibold line-clamp-2">{it.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Qty {it.qty}
                      {it.withExchange ? " · with exchange" : ""}
                    </div>
                  </div>
                  <div className="text-sm font-semibold whitespace-nowrap">
                    {formatINR(unit * it.qty)}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-semibold">{formatINR(tax)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className={deliveryOption.price === 0 ? "text-success font-semibold" : "font-semibold"}>
                {deliveryOption.price === 0 ? "FREE" : formatINR(deliveryOption.price)}
              </span>
            </div>
          </div>
          <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-bold text-xl">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>

          <div className="mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secure checkout · Your details are encrypted</span>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* ---------------- Step components ---------------- */

const AddressStep = ({
  address,
  setAddress,
}: {
  address: Address;
  setAddress: (a: Address) => void;
}) => {
  const set = (k: keyof Address, v: string) => setAddress({ ...address, [k]: v });
  return (
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Shipping address</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        We'll deliver and install your battery at this address.
      </p>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label="Full name" required>
          <Input value={address.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Ravi Kumar" />
        </Field>
        <Field label="Mobile number" required>
          <Input
            value={address.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98765 43210"
            inputMode="tel"
            maxLength={15}
          />
        </Field>
        <Field label="Email" required className="sm:col-span-2">
          <Input
            type="email"
            value={address.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="ravi@example.com"
          />
        </Field>
        <Field label="Address line 1" required className="sm:col-span-2">
          <Input
            value={address.line1}
            onChange={(e) => set("line1", e.target.value)}
            placeholder="House / Flat no., Street"
          />
        </Field>
        <Field label="Address line 2" className="sm:col-span-2">
          <Input
            value={address.line2}
            onChange={(e) => set("line2", e.target.value)}
            placeholder="Area, Colony (optional)"
          />
        </Field>
        <Field label="Landmark">
          <Input
            value={address.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            placeholder="Near… (optional)"
          />
        </Field>
        <Field label="PIN code" required>
          <Input
            value={address.pincode}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="560001"
            inputMode="numeric"
          />
        </Field>
        <Field label="City" required>
          <Input value={address.city} onChange={(e) => set("city", e.target.value)} placeholder="Bengaluru" />
        </Field>
        <Field label="State" required>
          <Input value={address.state} onChange={(e) => set("state", e.target.value)} placeholder="Karnataka" />
        </Field>
        <Field label="Delivery notes" className="sm:col-span-2">
          <Textarea
            rows={3}
            value={address.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Any specific delivery instructions… (optional)"
          />
        </Field>
      </div>
    </div>
  );
};

const DeliveryStep = ({
  delivery,
  setDelivery,
}: {
  delivery: DeliveryId;
  setDelivery: (d: DeliveryId) => void;
}) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Delivery method</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Choose how you'd like your battery delivered.
      </p>

      <RadioGroup value={delivery} onValueChange={(v) => setDelivery(v as DeliveryId)} className="mt-6 space-y-3">
        {DELIVERY_OPTIONS.map((o) => {
          const Icon = o.icon;
          const active = delivery === o.id;
          return (
            <label
              key={o.id}
              htmlFor={`del-${o.id}`}
              className={[
                "flex items-center gap-4 p-4 border cursor-pointer transition-colors",
                active ? "border-primary bg-primary/5" : "border-line hover:border-ink-soft",
              ].join(" ")}
            >
              <RadioGroupItem id={`del-${o.id}`} value={o.id} />
              <Icon className={`h-6 w-6 ${active ? "text-primary" : "text-ink-soft"}`} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold">{o.label}</div>
                <div className="text-xs text-muted-foreground">{o.eta}</div>
              </div>
              <div className="text-sm font-bold whitespace-nowrap">
                {o.price === 0 ? <span className="text-success">FREE</span> : formatINR(o.price)}
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

const PaymentStep = ({
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

      <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentId)} className="mt-6 space-y-3">
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

const ReviewStep = ({
  items,
  address,
  delivery,
  payment,
}: {
  items: ReturnType<typeof useCart>["items"];
  address: Address;
  delivery: (typeof DELIVERY_OPTIONS)[number];
  payment: (typeof PAYMENT_OPTIONS)[number];
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display-tight text-xl font-bold">Review & confirm</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please double-check everything before placing your order.
        </p>
      </div>

      <ReviewBlock title="Shipping to" icon={MapPin}>
        <div className="text-sm">
          <div className="font-semibold">{address.fullName}</div>
          <div>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </div>
          {address.landmark && <div className="text-muted-foreground">Landmark: {address.landmark}</div>}
          <div>
            {address.city}, {address.state} – {address.pincode}
          </div>
          <div className="mt-1 text-muted-foreground">
            {address.phone} · {address.email}
          </div>
          {address.notes && (
            <div className="mt-2 text-xs italic text-muted-foreground">"{address.notes}"</div>
          )}
        </div>
      </ReviewBlock>

      <ReviewBlock title="Delivery" icon={Truck}>
        <div className="text-sm flex items-center justify-between">
          <div>
            <div className="font-semibold">{delivery.label}</div>
            <div className="text-xs text-muted-foreground">{delivery.eta}</div>
          </div>
          <div className="font-bold">
            {delivery.price === 0 ? <span className="text-success">FREE</span> : formatINR(delivery.price)}
          </div>
        </div>
      </ReviewBlock>

      <ReviewBlock title="Payment" icon={payment.icon}>
        <div className="text-sm">
          <div className="font-semibold">{payment.label}</div>
          <div className="text-xs text-muted-foreground">{payment.hint}</div>
        </div>
      </ReviewBlock>

      <ReviewBlock title={`Items (${items.length})`} icon={ShieldCheck}>
        <ul className="divide-y divide-line">
          {items.map((it) => {
            const k = lineKey(it);
            const unit = lineUnitPrice(it);
            return (
              <li key={k} className="py-2 flex justify-between gap-4 text-sm">
                <div className="min-w-0">
                  <div className="font-display font-semibold line-clamp-1">{it.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Qty {it.qty} × {formatINR(unit)}
                    {it.withExchange ? " · with exchange" : ""}
                  </div>
                </div>
                <div className="font-semibold whitespace-nowrap">{formatINR(unit * it.qty)}</div>
              </li>
            );
          })}
        </ul>
      </ReviewBlock>
    </div>
  );
};

/* ---------------- Small helpers ---------------- */

const Field = ({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={className}>
    <Label className="text-xs font-display font-semibold uppercase tracking-wide">
      {label} {required && <span className="text-primary">*</span>}
    </Label>
    <div className="mt-1.5">{children}</div>
  </div>
);

const ReviewBlock = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) => (
  <div className="border border-line p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-display font-bold uppercase tracking-wide text-sm">{title}</h3>
    </div>
    {children}
  </div>
);

export default Checkout;
