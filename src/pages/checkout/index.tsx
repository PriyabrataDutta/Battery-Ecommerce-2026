/**
 * Checkout — multi-step purchase wizard.
 *
 * Flow: Address → Delivery → Payment → Review → place order.
 *
 * Data in:
 *   - useCart()                  — line items + subtotal (client store)
 *   - useDefaultAddress(user.id) — prefill (api/addresses.ts via hooks/queries)
 *
 * Data out:
 *   - useOrderQuote() / usePlaceOrder() — server prices and places the order
 *                                  (api/orders.ts), then we navigate to
 *                                  /order-confirmation.
 *
 * Page-local state lives here:
 *   - the step pointer
 *   - the address form values + errors
 *   - the chosen delivery / payment / promo / date / slot
 * It's kept in `useState`s rather than React Query because none of it
 * belongs on the server until the user clicks "Place order".
 *
 * All the heavy lifting (validation, totals, draft persistence) lives in
 * ./lib/*. Each step is a sibling component in ./components/*.
 *
 * Adding a new step:
 *   1. Add the label to STEPS in lib/constants.ts.
 *   2. Add the step UI under components/<Name>Step.tsx.
 *   3. Render it from the switch below.
 *   4. Add validation in lib/validation.ts and call it from `goNext`.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Check, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { lineUnitPrice, useCart, useCartSync } from "@/hooks/useCart";
import { useDefaultAddress } from "@/hooks/queries/useAddresses";
import { useOrderQuote, usePlaceOrder } from "@/hooks/queries/useOrders";
import { useShippingSettings } from "@/hooks/useShippingSettings";
import { quoteOrder } from "@/api/orders";
import { getPaymentMethods } from "@/api/payments";
import { payOnline } from "@/lib/cashfree";
import { useQuery } from "@tanstack/react-query";
import { formatINR } from "@/lib/format";

import { AddressStep } from "./components/AddressStep";
import { DeliveryStep } from "./components/DeliveryStep";
import { PaymentStep } from "./components/PaymentStep";
import { ReviewStep } from "./components/ReviewStep";
import { OrderSummary } from "./components/OrderSummary";

import {
  EMPTY_ADDRESS,
  PAYMENT_OPTIONS,
  STEPS,
  findSlot,
  isDateDisabled,
  slotsForDelivery,
} from "./lib/constants";
import { validateAddress, validateSchedule } from "./lib/validation";
import { clearDraft, clearOrderAttempt, loadDraft, orderAttemptKey, saveDraft } from "./lib/draft";
import type {
  Address,
  AddressErrors,
  DeliveryId,
  PaymentId,
  Promo,
  SlotId,
  Step,
} from "./lib/types";
import { DRAFT_TTL_MS } from "./lib/constants";

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, clear } = useCart();
  useCartSync();
  // Delivery methods and prices come from Admin → Settings → Shipping, the same
  // source the server prices from.
  const { deliveryOptions } = useShippingSettings();
  // Hydrate from any non-expired draft synchronously so a page refresh keeps
  // exactly what the user typed. Drafts older than 5 minutes self-destruct.
  const initialDraft = typeof window !== "undefined" ? loadDraft() : null;

  const [step, setStep] = useState<Step>(0);
  const [address, setAddress] = useState<Address>(initialDraft?.address ?? EMPTY_ADDRESS);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [delivery, setDelivery] = useState<DeliveryId>(initialDraft?.delivery ?? "standard");
  const [payment, setPayment] = useState<PaymentId>("cod");
  const { data: methods } = useQuery({ queryKey: ["payment-methods"], queryFn: getPaymentMethods, staleTime: 60_000 });
  const availablePayments = useMemo(
    () => (methods ? (["online", "cod"] as PaymentId[]).filter((m) => methods[m]) : undefined),
    [methods],
  );
  // Default to the first method that's switched on (online first).
  useEffect(() => {
    if (availablePayments?.length && !availablePayments.includes(payment)) setPayment(availablePayments[0]);
  }, [availablePayments, payment]);
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState(initialDraft?.promoInput ?? "");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    initialDraft?.deliveryDate ? new Date(initialDraft.deliveryDate) : undefined,
  );
  const [slot, setSlot] = useState<SlotId | "">(initialDraft?.slot ?? "");
  const [scheduleError, setScheduleError] = useState("");

  const { data: defaultAddress } = useDefaultAddress(user?.id);
  const placeOrderMutation = usePlaceOrder();

  // Persist a draft on every meaningful change. Self-destructs after 5 min via loadDraft().
  useEffect(() => {
    const hasAnyValue =
      Object.values(address).some((v) => typeof v === "string" && v.trim().length > 0) ||
      promoInput.trim().length > 0 ||
      !!deliveryDate ||
      slot !== "";
    if (!hasAnyValue) return;
    saveDraft({
      address,
      delivery,
      payment,
      promoInput,
      deliveryDate: deliveryDate ? deliveryDate.toISOString() : null,
      slot,
    });
  }, [address, delivery, payment, promoInput, deliveryDate, slot]);

  // Auto-purge after the TTL elapses while the page is still open.
  useEffect(() => {
    const t = setTimeout(() => clearDraft(), DRAFT_TTL_MS);
    return () => clearTimeout(t);
  }, []);

  // Prefill from logged-in user: email + saved default address (if any).
  // We never clobber a field the user has already filled in.
  useEffect(() => {
    if (!user) return;
    const updates: Partial<Address> = {};
    if (user.email) updates.email = user.email;
    if (defaultAddress) {
      updates.fullName = defaultAddress.full_name ?? "";
      updates.phone = defaultAddress.phone ?? "";
      updates.line1 = defaultAddress.line1 ?? "";
      updates.line2 = defaultAddress.line2 ?? "";
      updates.landmark = defaultAddress.landmark ?? "";
      updates.city = defaultAddress.city ?? "";
      updates.state = defaultAddress.state ?? "";
      updates.pincode = defaultAddress.pincode ?? "";
      updates.gstin = defaultAddress.gstin ?? "";
    }
    setAddress((prev) => {
      const merged = { ...prev };
      for (const k of Object.keys(updates) as (keyof Address)[]) {
        if (!merged[k]) merged[k] = updates[k] ?? "";
      }
      return merged;
    });
  }, [user, defaultAddress]);

  const deliveryOption = useMemo(
    () => deliveryOptions.find((o) => o.id === delivery) ?? deliveryOptions[0],
    [delivery, deliveryOptions],
  );

  // Prices, GST, promo and shipping all come from the server (quote_order).
  // The browser only says which products, how many, and exchange or not.
  const cartLines = useMemo(
    () => items.map((it) => ({ product_id: it.id, qty: it.qty, with_exchange: !!it.withExchange })),
    [items],
  );
  const { data: quote, error: quoteError } = useOrderQuote(cartLines, delivery, promoCode);
  const totals = {
    subtotal: quote?.subtotal ?? subtotal,
    discount: quote?.discount ?? 0,
    tax: quote?.tax ?? 0,
    shipping: quote?.shipping ?? deliveryOption.price,
    roundOff: quote?.round_off ?? 0,
    total: quote?.total ?? 0,
  };
  const { total } = totals;
  const appliedPromo: Promo | null = quote?.promo ?? null;

  // A promo can stop qualifying after cart edits — drop it and say why.
  useEffect(() => {
    if (promoCode && quote?.promo_error) {
      setPromoError(quote.promo_error);
      setPromoCode(null);
    }
  }, [promoCode, quote?.promo_error]);

  const applyPromo = async () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return setPromoError("Enter a promo code.");
    try {
      const q = await quoteOrder(cartLines, delivery, code);
      if (q.promo_error || !q.promo) return setPromoError(q.promo_error ?? "Invalid promo code.");
      setPromoCode(q.promo.code);
      setPromoInput("");
      toast.success(`Promo "${q.promo.code}" applied — ${q.promo.label}`);
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : "Could not check promo code.");
    }
  };

  const removePromo = () => {
    setPromoCode(null);
    setPromoError("");
    toast.message("Promo code removed");
  };

  // Empty cart → bounce to /cart. Anonymous user → bounce to /auth.
  if (items.length === 0) return <Navigate to="/cart" replace />;
  if (authLoading) {
    return (
      <div className="container-x py-20 text-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?next=/checkout" replace />;

  const runAddressValidation = (): Address | null => {
    const { ok, errors: errs } = validateAddress(address);
    if (!ok) {
      setErrors(errs);
      const firstMsg = Object.values(errs)[0];
      if (firstMsg) toast.error(firstMsg);
      return null;
    }
    setErrors({});
    return ok;
  };

  const goNext = () => {
    if (step === 0) {
      const ok = runAddressValidation();
      if (!ok) return;
      setAddress(ok); // persist normalised values
    }
    if (step === 1) {
      const err = validateSchedule(deliveryDate, slot, delivery, address.notes);
      if (err) {
        setScheduleError(err);
        toast.error(err);
        const slotMeta = findSlot(slot);
        if (slotMeta && slotMeta.notesMin > 0 && address.notes.trim().length < slotMeta.notesMin) {
          setErrors((e) => ({
            ...e,
            notes: `"${slotMeta.label}" needs delivery notes (≥${slotMeta.notesMin} chars).`,
          }));
        }
        return;
      }
      setScheduleError("");
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
    const ok = runAddressValidation();
    if (!ok) {
      setStep(0);
      return;
    }
    const schedErr = validateSchedule(deliveryDate, slot, delivery, address.notes);
    if (schedErr) {
      setScheduleError(schedErr);
      toast.error(schedErr);
      setStep(1);
      return;
    }

    setSubmitting(true);
    const slotMeta = findSlot(slot)!;
    const paymentMeta = PAYMENT_OPTIONS.find((p) => p.id === payment)!;

    const request = {
      items: cartLines,
      delivery,
      promo: promoCode,
      payment,
      address: JSON.parse(JSON.stringify(ok)),
      scheduledDate: format(deliveryDate!, "yyyy-MM-dd"),
      slot,
      slotLabel: slotMeta.label,
      slotWindow: slotMeta.window,
    };
    let placed;
    try {
      placed = await placeOrderMutation.mutateAsync({ ...request, idempotencyKey: orderAttemptKey(request) });
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof Error ? err.message : "Could not place order. Please try again.";
      toast.error(message);
      return;
    }

    // Snapshot for the confirmation page — amounts are the server's, not ours.
    const byId = new Map(items.map((it) => [it.id, it]));
    const order = {
      orderNumber: placed.order_number,
      placedAt: new Date().toISOString(),
      items: placed.lines.map((l) => ({
        id: l.product_id,
        name: l.name,
        slug: l.slug,
        sku: l.sku,
        image: byId.get(l.product_id)?.image ?? null,
        qty: l.qty,
        unitPrice: l.unit_price,
        lineTotal: l.line_total,
        withExchange: l.with_exchange,
      })),
      address: ok,
      delivery: { ...deliveryOption, price: placed.shipping },
      schedule: {
        date: deliveryDate!.toISOString(),
        dateLabel: format(deliveryDate!, "EEE, dd MMM yyyy"),
        slot,
        slotLabel: slotMeta.label,
        slotWindow: slotMeta.window,
      },
      payment: paymentMeta,
      totals: {
        subtotal: placed.subtotal,
        discount: placed.discount,
        promo: placed.promo,
        tax: placed.tax,
        shipping: placed.shipping,
        roundOff: placed.round_off,
        total: placed.total,
      },
    };
    sessionStorage.setItem("kachi_last_order", JSON.stringify(order));
    clear();
    clearDraft();
    clearOrderAttempt();
    const confirmationUrl = `/order-confirmation?order=${encodeURIComponent(placed.order_number)}`;

    if (payment === "online") {
      // The order exists and holds stock; hand over to Cashfree. It returns the
      // shopper to the confirmation page, which confirms payment server-side.
      try {
        await payOnline(placed.order_number);
        return;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not open the payment page.", {
          description: "Your order is saved — you can retry payment from the next page.",
        });
      }
    }
    setSubmitting(false);
    navigate(confirmationUrl, { replace: true });
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
              options={deliveryOptions}
              delivery={delivery}
              setDelivery={(d) => {
                setDelivery(d);
                // Drop a previously-chosen date that's no longer valid for the
                // new method (different lead times / Sunday rules).
                if (deliveryDate && isDateDisabled(deliveryDate, d)) {
                  setDeliveryDate(undefined);
                }
                // Slot lists differ between standard and installation, so
                // always reset the slot when the method changes.
                if (slot && !slotsForDelivery(d).some((s) => s.id === slot)) {
                  setSlot("");
                }
                setScheduleError("");
              }}
              notesLength={address.notes.trim().length}
              deliveryDate={deliveryDate}
              setDeliveryDate={(d) => {
                setDeliveryDate(d);
                setScheduleError("");
              }}
              slot={slot}
              setSlot={(s) => {
                setSlot(s);
                setScheduleError("");
              }}
              scheduleError={scheduleError}
            />
          )}
          {step === 2 && <PaymentStep payment={payment} setPayment={setPayment} available={availablePayments} />}
          {step === 3 && (
            <ReviewStep
              items={items}
              address={address}
              delivery={deliveryOption}
              payment={PAYMENT_OPTIONS.find((p) => p.id === payment)!}
              schedule={
                deliveryDate && slot
                  ? {
                      dateLabel: format(deliveryDate, "EEE, dd MMM yyyy"),
                      slotLabel: findSlot(slot)!.label,
                      slotWindow: findSlot(slot)!.window,
                    }
                  : null
              }
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
              <Button
                onClick={placeOrder}
                size="lg"
                disabled={submitting || !quote || !!quoteError || !availablePayments?.includes(payment)}
                className="min-w-[180px]"
              >
                {submitting
                  ? payment === "online" ? "Opening payment…" : "Placing order…"
                  : payment === "online" ? `Pay securely · ${formatINR(total)}` : `Place order · ${formatINR(total)}`}
              </Button>
            )}
          </div>
        </section>

        <OrderSummary
          items={items}
          totals={totals}
          deliveryOption={deliveryOption}
          appliedPromo={appliedPromo}
          quoteError={quoteError instanceof Error ? quoteError.message : null}
          promoInput={promoInput}
          setPromoInput={setPromoInput}
          promoError={promoError}
          clearPromoError={() => setPromoError("")}
          onApplyPromo={applyPromo}
          onRemovePromo={removePromo}
        />
      </div>
    </div>
  );
};

export default Checkout;
