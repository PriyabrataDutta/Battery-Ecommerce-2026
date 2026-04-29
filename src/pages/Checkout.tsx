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
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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
  gstin: string;
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
  gstin: "",
  notes: "",
};

// Permitted characters across address-like fields: letters, numbers, common
// Indian punctuation. Blocks angle brackets, braces, backticks, and pipes to
// stop trivial injection attempts before they reach any backend.
const SAFE_TEXT = /^[\p{L}\p{N}\s,.\-/#&()'’]*$/u;

// Official Indian GSTIN format: 2-digit state, 10-char PAN, 1 entity, "Z",
// 1 checksum. Case-insensitive on input; we uppercase before validating.
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/**
 * Address schema. Field-level rules are intentionally explicit so the UI can
 * show targeted error messages. `gstin`, `landmark`, and `notes` are tightened
 * per the latest checkout requirements.
 */
const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be under 80 characters")
    .regex(/^[\p{L}\s.'’-]+$/u, "Full name can only contain letters, spaces, and . ' -"),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(
      z
        .string()
        .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    ),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(120, "Email must be under 120 characters"),
  line1: z
    .string()
    .trim()
    .min(5, "Address line 1 must be at least 5 characters")
    .max(120, "Address line 1 must be under 120 characters")
    .regex(SAFE_TEXT, "Address contains unsupported characters"),
  line2: z
    .string()
    .trim()
    .max(120, "Address line 2 must be under 120 characters")
    .regex(SAFE_TEXT, "Address contains unsupported characters")
    .optional()
    .or(z.literal("")),
  landmark: z
    .string()
    .trim()
    .min(3, "Landmark should be at least 3 characters (helps the delivery agent)")
    .max(80, "Landmark must be under 80 characters")
    .regex(SAFE_TEXT, "Landmark contains unsupported characters"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(60, "City must be under 60 characters")
    .regex(/^[\p{L}\s.'-]+$/u, "City can only contain letters"),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(60, "State must be under 60 characters")
    .regex(/^[\p{L}\s.'-]+$/u, "State can only contain letters"),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian PIN code"),
  // GSTIN is optional for B2C buyers. When provided, it must be a real GSTIN
  // and the embedded state code (first 2 digits) must match the state code
  // table — but cross-checking state-name → state-code is out of scope here,
  // so we only enforce the structural format.
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || GSTIN_REGEX.test(v), {
      message: "Invalid GSTIN. Format: 22AAAAA0000A1Z5",
    })
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be under 500 characters")
    .regex(SAFE_TEXT, "Notes contain unsupported characters")
    .optional()
    .or(z.literal("")),
});

type AddressErrors = Partial<Record<keyof Address, string>>;

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

/**
 * Promo codes (frontend mockup). Each code applies to the cart subtotal,
 * which then flows into GST and the final total.
 *  - `percent`: % off subtotal
 *  - `flat`: flat ₹ off subtotal
 * `minSubtotal` lets us gate higher discounts behind a minimum order value.
 */
type Promo = {
  code: string;
  label: string;
  type: "percent" | "flat";
  value: number;
  minSubtotal?: number;
};
const PROMO_CODES: Promo[] = [
  { code: "KACHI10", label: "10% off your order", type: "percent", value: 10 },
  { code: "FLAT500", label: "₹500 off orders above ₹5,000", type: "flat", value: 500, minSubtotal: 5000 },
  { code: "FESTIVE15", label: "15% off orders above ₹8,000", type: "percent", value: 15, minSubtotal: 8000 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, subtotal, clear } = useCart();
  const [step, setStep] = useState<Step>(0);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [delivery, setDelivery] = useState<DeliveryId>("standard");
  const [payment, setPayment] = useState<PaymentId>("upi");
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState<string>("");

  const deliveryOption = useMemo(
    () => DELIVERY_OPTIONS.find((o) => o.id === delivery)!,
    [delivery],
  );

  // Discount applies to subtotal. GST recomputes against the discounted
  // subtotal so the customer also saves the tax on the discounted amount.
  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.minSubtotal && subtotal < appliedPromo.minSubtotal) return 0;
    const raw =
      appliedPromo.type === "percent"
        ? Math.round((subtotal * appliedPromo.value) / 100)
        : appliedPromo.value;
    // Never let discount exceed subtotal.
    return Math.min(raw, subtotal);
  }, [appliedPromo, subtotal]);

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = useMemo(() => Math.round(discountedSubtotal * 0.18), [discountedSubtotal]);
  const total = discountedSubtotal + tax + deliveryOption.price;

  // If cart drops below the promo's minimum after edits, auto-clear it.
  if (appliedPromo?.minSubtotal && subtotal < appliedPromo.minSubtotal && discount === 0) {
    // schedule clear in microtask to avoid setState during render
    queueMicrotask(() => {
      setAppliedPromo(null);
      setPromoError(`"${appliedPromo.code}" requires a minimum subtotal of ${formatINR(appliedPromo.minSubtotal!)}.`);
    });
  }

  const applyPromo = () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }
    const match = PROMO_CODES.find((p) => p.code === code);
    if (!match) {
      setPromoError("Invalid promo code.");
      return;
    }
    if (match.minSubtotal && subtotal < match.minSubtotal) {
      setPromoError(
        `This code requires a minimum subtotal of ${formatINR(match.minSubtotal)}.`,
      );
      return;
    }
    setAppliedPromo(match);
    setPromoInput("");
    toast.success(`Promo "${match.code}" applied — ${match.label}`);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoError("");
    toast.message("Promo code removed");
  };

  if (items.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  /**
   * Run the zod schema and apply context-sensitive rules:
   *   - When delivery method is "installation", `notes` becomes mandatory
   *     so the installer knows model/parking/access details.
   * Returns a normalised address (trimmed, GSTIN uppercased) on success, or
   * `null` if validation failed (errors are written to state).
   */
  const validateAddress = (a: Address, deliveryId: DeliveryId): Address | null => {
    const result = addressSchema.safeParse(a);
    const fieldErrors: AddressErrors = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Address | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
    }

    // Conditional rule: installation requires notes.
    if (deliveryId === "installation") {
      const trimmed = a.notes.trim();
      if (trimmed.length < 10) {
        fieldErrors.notes =
          "Installation orders need delivery notes (≥10 chars): vehicle/model, parking, access.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const firstMsg = Object.values(fieldErrors)[0];
      if (firstMsg) toast.error(firstMsg);
      return null;
    }

    setErrors({});
    return { ...a, ...result.data } as Address;
  };

  const goNext = () => {
    if (step === 0) {
      const ok = validateAddress(address, delivery);
      if (!ok) return;
      setAddress(ok); // persist normalised values
    }
    // If the user changed delivery to "installation" after passing step 0,
    // re-check notes when leaving the Delivery step.
    if (step === 1 && delivery === "installation" && address.notes.trim().length < 10) {
      setErrors((e) => ({
        ...e,
        notes:
          "Installation orders need delivery notes (≥10 chars): vehicle/model, parking, access.",
      }));
      toast.error("Please add delivery notes for installation, then go back to Address.");
      return;
    }
    setStep((s) => Math.min(3, s + 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setStep((s) => Math.max(0, s - 1) as Step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    // Defence-in-depth: re-validate before placing the order in case anything
    // was bypassed via back-navigation or React DevTools state edits.
    const ok = validateAddress(address, delivery);
    if (!ok) {
      setStep(0);
      return;
    }

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
      address: ok,
      delivery: deliveryOption,
      payment: PAYMENT_OPTIONS.find((p) => p.id === payment)!,
      totals: {
        subtotal,
        discount,
        promo: appliedPromo
          ? { code: appliedPromo.code, label: appliedPromo.label }
          : null,
        tax,
        shipping: deliveryOption.price,
        total,
      },
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
            <AddressStep
              address={address}
              setAddress={setAddress}
              errors={errors}
              clearError={(k) => setErrors((e) => ({ ...e, [k]: undefined }))}
              installationSelected={delivery === "installation"}
            />
          )}
          {step === 1 && (
            <DeliveryStep
              delivery={delivery}
              setDelivery={setDelivery}
              hasNotes={address.notes.trim().length >= 10}
            />
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

          {/* Promo code */}
          <div className="border-t border-line mt-4 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-xs font-display font-semibold uppercase tracking-wide">
                Promo code
              </span>
            </div>

            {appliedPromo ? (
              <div className="flex items-center justify-between gap-2 bg-success/10 border border-success/30 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-mono font-bold tracking-wider text-success">
                    {appliedPromo.code}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {appliedPromo.label}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removePromo}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Remove promo code"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value.toUpperCase().slice(0, 20));
                      if (promoError) setPromoError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        applyPromo();
                      }
                    }}
                    placeholder="Enter code"
                    className="font-mono uppercase tracking-wider"
                    maxLength={20}
                    aria-invalid={!!promoError}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={applyPromo}
                    disabled={!promoInput.trim()}
                  >
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <p className="mt-1 text-xs text-destructive font-medium" role="alert">
                    {promoError}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Try{" "}
                  <button
                    type="button"
                    className="font-mono font-semibold text-primary hover:underline"
                    onClick={() => setPromoInput("KACHI10")}
                  >
                    KACHI10
                  </button>{" "}
                  for 10% off.
                </p>
              </>
            )}
          </div>

          <div className="border-t border-line mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-success">
                  Discount{appliedPromo ? ` (${appliedPromo.code})` : ""}
                </span>
                <span className="font-semibold text-success">−{formatINR(discount)}</span>
              </div>
            )}
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
          {discount > 0 && (
            <div className="mt-1 text-xs text-success font-medium text-right">
              You saved {formatINR(discount + Math.round((subtotal * 0.18) - tax))} on this order
            </div>
          )}

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
  errors,
  clearError,
  installationSelected,
}: {
  address: Address;
  setAddress: (a: Address) => void;
  errors: AddressErrors;
  clearError: (k: keyof Address) => void;
  installationSelected: boolean;
}) => {
  const set = (k: keyof Address, v: string) => {
    setAddress({ ...address, [k]: v });
    if (errors[k]) clearError(k);
  };
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
        <Field label="Full name" required error={errors.fullName}>
          <Input
            value={address.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="Ravi Kumar"
            maxLength={80}
            aria-invalid={!!errors.fullName}
          />
        </Field>
        <Field label="Mobile number" required error={errors.phone}>
          <Input
            value={address.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98765 43210"
            inputMode="tel"
            maxLength={15}
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label="Email" required className="sm:col-span-2" error={errors.email}>
          <Input
            type="email"
            value={address.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="ravi@example.com"
            maxLength={120}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Address line 1" required className="sm:col-span-2" error={errors.line1}>
          <Input
            value={address.line1}
            onChange={(e) => set("line1", e.target.value)}
            placeholder="House / Flat no., Street"
            maxLength={120}
            aria-invalid={!!errors.line1}
          />
        </Field>
        <Field label="Address line 2" className="sm:col-span-2" error={errors.line2}>
          <Input
            value={address.line2}
            onChange={(e) => set("line2", e.target.value)}
            placeholder="Area, Colony (optional)"
            maxLength={120}
            aria-invalid={!!errors.line2}
          />
        </Field>
        <Field
          label="Landmark"
          required
          error={errors.landmark}
          help="Helps the delivery agent locate you (e.g. ‘opposite Reliance Smart’)."
        >
          <Input
            value={address.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            placeholder="Opposite Reliance Smart"
            maxLength={80}
            aria-invalid={!!errors.landmark}
          />
        </Field>
        <Field label="PIN code" required error={errors.pincode}>
          <Input
            value={address.pincode}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="560001"
            inputMode="numeric"
            aria-invalid={!!errors.pincode}
          />
        </Field>
        <Field label="City" required error={errors.city}>
          <Input
            value={address.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Bengaluru"
            maxLength={60}
            aria-invalid={!!errors.city}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <Input
            value={address.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="Karnataka"
            maxLength={60}
            aria-invalid={!!errors.state}
          />
        </Field>
        <Field
          label="GSTIN"
          className="sm:col-span-2"
          error={errors.gstin}
          help="Optional — add your business GSTIN to receive a tax invoice."
        >
          <Input
            value={address.gstin}
            onChange={(e) => set("gstin", e.target.value.toUpperCase().slice(0, 15))}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="uppercase tracking-wider"
            aria-invalid={!!errors.gstin}
          />
        </Field>
        <Field
          label={`Delivery notes${installationSelected ? "" : ""}`}
          required={installationSelected}
          className="sm:col-span-2"
          error={errors.notes}
          help={
            installationSelected
              ? "Required for installation: vehicle make/model, parking spot, building access (gate code, lift, floor)."
              : "Optional — any specific delivery instructions."
          }
        >
          <Textarea
            rows={3}
            value={address.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder={
              installationSelected
                ? "e.g. Maruti Swift 2019, basement parking B2, intercom #404, lift available"
                : "Any specific delivery instructions… (optional)"
            }
            maxLength={500}
            aria-invalid={!!errors.notes}
          />
        </Field>
      </div>
    </div>
  );
};

const DeliveryStep = ({
  delivery,
  setDelivery,
  hasNotes,
}: {
  delivery: DeliveryId;
  setDelivery: (d: DeliveryId) => void;
  hasNotes: boolean;
}) => {
  const showNotesWarning = delivery === "installation" && !hasNotes;
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

      {showNotesWarning && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-700 dark:text-amber-400"
        >
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Delivery notes required</div>
            <div>
              Installation orders need at least 10 characters of notes (vehicle, parking, access).
              Please go back and update the Address step before continuing.
            </div>
          </div>
        </div>
      )}
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
          {address.gstin && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">GSTIN:</span>{" "}
              <span className="font-mono font-semibold tracking-wider">{address.gstin}</span>
            </div>
          )}
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
  error,
  help,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  error?: string;
  help?: string;
}) => (
  <div className={className}>
    <Label className="text-xs font-display font-semibold uppercase tracking-wide">
      {label} {required && <span className="text-primary">*</span>}
    </Label>
    <div className="mt-1.5">{children}</div>
    {error ? (
      <p className="mt-1 text-xs text-destructive font-medium" role="alert">
        {error}
      </p>
    ) : help ? (
      <p className="mt-1 text-xs text-muted-foreground">{help}</p>
    ) : null}
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
