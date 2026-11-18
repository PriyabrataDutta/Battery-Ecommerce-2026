/**
 * Checkout — static data (delivery methods, payment methods, slots, promos).
 *
 * Only constants + plain helpers that derive from those constants. No React.
 *
 * Where to add things:
 *   - new delivery method  → DELIVERY_OPTIONS + DELIVERY_LEAD_DAYS
 *   - new payment method   → PAYMENT_OPTIONS + a PaymentId in lib/types.ts
 *   - new time slot        → STANDARD_SLOTS or INSTALLATION_SLOTS, plus a
 *                            SlotId in lib/types.ts
 *   - new wizard step      → STEPS, plus a step component + render branch in
 *                            ../index.tsx
 */
import {
  Truck,
  ShieldCheck,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
} from "lucide-react";
import { addDays } from "date-fns";
import type {
  Address,
  DeliveryId,
  DeliveryOption,
  PaymentOption,
  Promo,
  Slot,
} from "./types";

export const EMPTY_ADDRESS: Address = {
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

export const DELIVERY_OPTIONS: DeliveryOption[] = [
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

export const PAYMENT_OPTIONS: PaymentOption[] = [
  { id: "upi", label: "UPI", hint: "Pay via Google Pay, PhonePe, Paytm, BHIM", icon: Smartphone },
  { id: "card", label: "Credit / Debit Card", hint: "Visa, Mastercard, Rupay, Amex", icon: CreditCard },
  { id: "netbanking", label: "Net Banking", hint: "All major Indian banks", icon: Wallet },
  { id: "cod", label: "Cash on Delivery", hint: "Pay in cash when your battery arrives", icon: Banknote },
];

export const STEPS = ["Address", "Delivery", "Payment", "Review"] as const;

export const STANDARD_SLOTS: Slot[] = [
  { id: "morning", label: "Morning", window: "8:00 AM – 11:00 AM", notesMin: 0 },
  { id: "midday", label: "Midday", window: "11:00 AM – 2:00 PM", notesMin: 0 },
  { id: "afternoon", label: "Afternoon", window: "2:00 PM – 5:00 PM", notesMin: 0 },
  { id: "evening", label: "Evening", window: "5:00 PM – 8:00 PM", notesMin: 0 },
];

export const INSTALLATION_SLOTS: Slot[] = [
  {
    id: "install_early",
    label: "Early Morning Install",
    window: "7:00 AM – 9:00 AM",
    notesMin: 20,
    notesHint:
      "Early-morning slot needs gate/lift access details so the technician can enter without delay.",
  },
  {
    id: "install_morning",
    label: "Morning Install",
    window: "9:00 AM – 12:00 PM",
    notesMin: 10,
    notesHint: "Add vehicle make/model and parking spot.",
  },
  {
    id: "install_midday",
    label: "Midday Install",
    window: "12:00 PM – 3:00 PM",
    notesMin: 10,
    notesHint: "Add vehicle make/model and parking spot.",
  },
  {
    id: "install_afternoon",
    label: "Afternoon Install",
    window: "3:00 PM – 6:00 PM",
    notesMin: 10,
    notesHint: "Add vehicle make/model and parking spot.",
  },
  {
    id: "install_evening",
    label: "Evening Install",
    window: "6:00 PM – 8:30 PM",
    notesMin: 25,
    notesHint:
      "Evening slot requires parking, lift availability, building access (gate code/intercom) and contact at site.",
  },
];

export const slotsForDelivery = (d: DeliveryId): Slot[] =>
  d === "installation" ? INSTALLATION_SLOTS : STANDARD_SLOTS;

export const findSlot = (id: Slot["id"] | "" | undefined): Slot | undefined =>
  id ? [...STANDARD_SLOTS, ...INSTALLATION_SLOTS].find((s) => s.id === id) : undefined;

/** Earliest day a method can deliver, counted from "today". */
export const DELIVERY_LEAD_DAYS: Record<DeliveryId, number> = {
  express: 1,
  standard: 3,
  installation: 2,
};
/** How far ahead the customer can schedule. */
export const DELIVERY_MAX_DAYS = 14;

export const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const earliestDeliveryDate = (d: DeliveryId) =>
  addDays(startOfToday(), DELIVERY_LEAD_DAYS[d]);

export const latestDeliveryDate = () =>
  addDays(startOfToday(), DELIVERY_MAX_DAYS);

export const isDateDisabled = (date: Date, d: DeliveryId) => {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  if (dayStart < earliestDeliveryDate(d)) return true;
  if (dayStart > latestDeliveryDate()) return true;
  // Sundays unavailable for installation (technician off-day).
  if (d === "installation" && dayStart.getDay() === 0) return true;
  return false;
};

/** localStorage key + TTL for the in-progress draft. */
export const DRAFT_KEY = "kachi_checkout_draft_v1";
export const DRAFT_TTL_MS = 5 * 60 * 1000; // 5 minutes
