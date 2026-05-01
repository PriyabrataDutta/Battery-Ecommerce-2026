/**
 * Checkout — input validation rules and helpers.
 *
 * Two pieces:
 *   1. `addressSchema` — zod schema for the address form. Rules are explicit
 *      so the UI can show field-level errors.
 *   2. `validateSchedule` — checks the chosen date + slot are valid for the
 *      selected delivery method, and that delivery notes meet the slot's
 *      minimum length.
 *
 * The address-notes minimum used to live here; it now belongs to the slot
 * (see constants.ts → INSTALLATION_SLOTS), because different installation
 * windows need different levels of detail.
 */
import { z } from "zod";
import type { Address, AddressErrors, DeliveryId, SlotId } from "./types";
import {
  findSlot,
  isDateDisabled,
  slotsForDelivery,
} from "./constants";

// Permitted characters across address-like fields: letters, numbers, common
// Indian punctuation. Blocks angle brackets, braces, backticks, and pipes to
// stop trivial injection attempts before they reach any backend.
export const SAFE_TEXT = /^[\p{L}\p{N}\s,.\-/#&()'’]*$/u;

// Official Indian GSTIN format: 2-digit state, 10-char PAN, 1 entity, "Z",
// 1 checksum. Case-insensitive on input; we uppercase before validating.
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const addressSchema = z.object({
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
  // GSTIN is optional for B2C buyers. When provided, it must be a real GSTIN.
  // We don't cross-check the embedded state code against the chosen state.
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

/**
 * Run the address schema. Returns the normalised address (trimmed, GSTIN
 * uppercased) plus any field errors. Caller decides what to do with the
 * result — typically: show errors on the form and a toast for the first one.
 */
export const validateAddress = (
  a: Address,
): { ok: Address | null; errors: AddressErrors } => {
  const result = addressSchema.safeParse(a);
  const errors: AddressErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof Address | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: null, errors };
  }
  return { ok: { ...a, ...result.data } as Address, errors };
};

/**
 * Validate the user's selected delivery date + slot against the chosen
 * delivery method. Returns an empty string when valid, an error message
 * otherwise.
 */
export const validateSchedule = (
  date: Date | undefined,
  slotId: SlotId | "",
  d: DeliveryId,
  notes: string,
): string => {
  if (!date) return "Please pick a delivery date.";
  if (!slotId) return "Please pick a delivery time slot.";
  if (isDateDisabled(date, d)) {
    return `That date isn't available for ${d} delivery. Please pick another.`;
  }
  const validIds = slotsForDelivery(d).map((s) => s.id);
  if (!validIds.includes(slotId)) {
    return "Selected time slot isn't valid for this delivery method.";
  }
  const slotMeta = findSlot(slotId);
  if (slotMeta && slotMeta.notesMin > 0) {
    const len = notes.trim().length;
    if (len < slotMeta.notesMin) {
      return `"${slotMeta.label}" needs delivery notes (≥${slotMeta.notesMin} chars). ${slotMeta.notesHint ?? ""}`.trim();
    }
  }
  return "";
};
