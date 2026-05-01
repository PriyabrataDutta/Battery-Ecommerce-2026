/**
 * AddressStep — Step 1 of checkout.
 *
 * Pure controlled form. Parent owns the address state and the validation
 * errors map; this component just renders fields and forwards changes.
 *
 * Adding a new field:
 *   1. Add it to `Address` in ../lib/types.ts.
 *   2. Add a validation rule to `addressSchema` in ../lib/validation.ts.
 *   3. Add a <Field> here.
 */
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./Field";
import type { Address, AddressErrors } from "../lib/types";

export const AddressStep = ({
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
          label="Delivery notes"
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
