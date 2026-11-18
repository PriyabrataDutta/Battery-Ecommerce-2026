/**
 * Checkout — types shared across all checkout files.
 *
 * Keep these tiny and dumb. Anything more interesting (validation,
 * formatters, persistence) belongs in a sibling lib file.
 */
import type { Truck, Wallet, MapPin } from "lucide-react";

export type Step = 0 | 1 | 2 | 3;

export interface Address {
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

export type AddressErrors = Partial<Record<keyof Address, string>>;

export type DeliveryId = "standard" | "express" | "installation";
export type PaymentId = "upi" | "card" | "netbanking" | "cod";

export type SlotId =
  | "morning"
  | "midday"
  | "afternoon"
  | "evening"
  | "install_early"
  | "install_morning"
  | "install_midday"
  | "install_afternoon"
  | "install_evening";

export interface Slot {
  id: SlotId;
  label: string;
  window: string;
  /** Min length of delivery notes the customer must provide for this slot. */
  notesMin: number;
  /** Helper text shown beside the notes requirement. */
  notesHint?: string;
}

/** An applied promo, as confirmed by the server. */
export type Promo = {
  code: string;
  label: string;
};

export type DeliveryOption = {
  id: DeliveryId;
  label: string;
  eta: string;
  price: number;
  icon: typeof Truck;
};

export type PaymentOption = {
  id: PaymentId;
  label: string;
  hint: string;
  icon: typeof Wallet;
};

/** Used by ReviewBlock — kept here so component files stay framework-light. */
export type IconType = typeof MapPin;
