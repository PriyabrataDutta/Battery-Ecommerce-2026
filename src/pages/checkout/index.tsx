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
 *   - useCreateOrder()           — writes the order header + items
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
import { lineUnitPrice, useCart } from "@/hooks/useCart";
import { useDefaultAddress } from "@/hooks/queries/useAddresses";
import { useCreateOrder } from "@/hooks/queries/useOrders";
import { formatINR } from "@/lib/format";
import { useGstSettings } from "@/hooks/useGstSettings";

import { AddressStep } from "./components/AddressStep";
import { DeliveryStep } from "./components/DeliveryStep";
import { PaymentStep } from "./components/PaymentStep";
import { ReviewStep } from "./components/ReviewStep";
import { OrderSummary } from "./components/OrderSummary";

import {
  DELIVERY_OPTIONS,
  EMPTY_ADDRESS,
  PAYMENT_OPTIONS,
  PROMO_CODES,
  STEPS,
  findSlot,
  isDateDisabled,
  slotsForDelivery,
} from "./lib/constants";
import { calcTotals } from "./lib/totals";
import { validateAddress, validateSchedule } from "./lib/validation";
import { clearDraft, loadDraft, saveDraft } from "./lib/draft";
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
  const { taxRate } = useGstSettings();

  // Hydrate from any non-expired draft synchronously so a page refresh keeps
  // exactly what the user typed. Drafts older than 5 minutes self-destruct.
  const initialDraft = typeof window !== "undefined" ? loadDraft() : null;

  const [step, setStep] = useState<Step>(0);
  const [address, setAddress] = useState<Address>(initialDraft?.address ?? EMPTY_ADDRESS);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [delivery, setDelivery] = useState<DeliveryId>(initialDraft?.delivery ?? "standard");
  const [payment, setPayment] = useState<PaymentId>(initialDraft?.payment ?? "upi");
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState(initialDraft?.promoInput ?? "");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    initialDraft?.deliveryDate ? new Date(initialDraft.deliveryDate) : undefined,
  );
  const [slot, setSlot] = useState<SlotId | "">(initialDraft?.slot ?? "");
  const [scheduleError, setScheduleError] = useState("");

  const { data: defaultAddress } = useDefaultAddress(user?.id);
  const createOrderMutation = useCreateOrder();

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
    () => DELIVERY_OPTIONS.find((o) => o.id === delivery)!,
    [delivery],
  );

  // Discount applies to subtotal. GST recomputes against the discounted
  // subtotal so the customer also saves the tax on the discounted amount.
  const totals = useMemo(
    () => calcTotals(subtotal, appliedPromo, deliveryOption),
    [subtotal, appliedPromo, deliveryOption],
  );
  const { discount, tax, total } = totals;

  // If cart drops below the promo's minimum after edits, auto-clear it.
  if (appliedPromo?.minSubtotal && subtotal < appliedPromo.minSubtotal && discount === 0) {
    queueMicrotask(() => {
      setAppliedPromo(null);
      setPromoError(
        `"${appliedPromo.code}" requires a minimum subtotal of ${formatINR(appliedPromo.minSubtotal!)}.`,
      );
    });
  }

  const applyPromo = () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return setPromoError("Enter a promo code.");
    const match = PROMO_CODES.find((p) => p.code === code);
    if (!match) return setPromoError("Invalid promo code.");
    if (match.minSubtotal && subtotal < match.minSubtotal) {
      return setPromoError(
        `This code requires a minimum subtotal of ${formatINR(match.minSubtotal)}.`,
      );
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
    const orderNumber = `KCH-${Date.now().toString().slice(-8)}`;
    const slotMeta = findSlot(slot)!;
    const paymentMeta = PAYMENT_OPTIONS.find((p) => p.id === payment)!;
    const scheduledDateOnly = format(deliveryDate!, "yyyy-MM-dd");

    // Persist via the orders API layer (header + items in one call).
    // RLS guarantees user_id = auth.uid().
    try {
      await createOrderMutation.mutateAsync({
        userId: user!.id,
        orderNumber,
        customer: { name: ok.fullName, email: ok.email, phone: ok.phone },
        address: JSON.parse(JSON.stringify(ok)),
        notes: ok.notes || null,
        subtotal,
        discount,
        tax,
        shipping: deliveryOption.price,
        total,
        promoCode: appliedPromo?.code ?? null,
        promoLabel: appliedPromo?.label ?? null,
        paymentMethod: paymentMeta.label,
        deliveryMethod: deliveryOption.id,
        deliveryLabel: deliveryOption.label,
        scheduledDate: scheduledDateOnly,
        scheduledSlot: slot,
        scheduledSlotLabel: slotMeta.label,
        scheduledSlotWindow: slotMeta.window,
        items: items.map((it) => ({
          product_id: it.id,
          product_name: it.name + (it.withExchange ? " (with exchange)" : ""),
          product_sku: it.sku,
          qty: it.qty,
          unit_price: lineUnitPrice(it),
        })),
      });
    } catch (err) {
      setSubmitting(false);
      const message =
        err instanceof Error ? err.message : "Could not place order. Please try again.";
      toast.error(message);
      return;
    }

    // Mirror to sessionStorage so the OrderConfirmation page can render
    // immediately without re-fetching, and so guests who logged in mid-flow
    // still see the success screen.
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
      schedule: {
        date: deliveryDate!.toISOString(),
        dateLabel: format(deliveryDate!, "EEE, dd MMM yyyy"),
        slot,
        slotLabel: slotMeta.label,
        slotWindow: slotMeta.window,
      },
      payment: paymentMeta,
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
    clearDraft();
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
          {step === 2 && <PaymentStep payment={payment} setPayment={setPayment} />}
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
                disabled={submitting}
                className="min-w-[180px]"
              >
                {submitting ? "Placing order…" : `Place order · ${formatINR(total)}`}
              </Button>
            )}
          </div>
        </section>

        <OrderSummary
          items={items}
          totals={totals}
          deliveryOption={deliveryOption}
          appliedPromo={appliedPromo}
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
