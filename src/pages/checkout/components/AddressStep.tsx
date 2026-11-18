/**
 * AddressStep — Step 1 of checkout.
 *
 * Controlled form: the parent owns address + errors. Each field validates
 * when the shopper leaves it (onBlurField) and again on Continue, which
 * won't advance until everything required is valid.
 *
 * Delivery notes live in the Delivery step, next to the slot that decides
 * whether they're required.
 */
import { AlertCircle, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "./Field";
import { INDIAN_STATES } from "../lib/constants";
import type { Address, AddressErrors } from "../lib/types";

const LABELS: Partial<Record<keyof Address, string>> = {
  fullName: "Full name",
  phone: "Mobile number",
  email: "Email",
  line1: "Address line 1",
  line2: "Address line 2",
  landmark: "Landmark",
  pincode: "PIN code",
  city: "City",
  state: "State",
  gstin: "GSTIN",
};

export const AddressStep = ({
  address,
  setAddress,
  errors,
  clearError,
  onBlurField,
}: {
  address: Address;
  setAddress: (a: Address) => void;
  errors: AddressErrors;
  clearError: (k: keyof Address) => void;
  onBlurField: (k: keyof Address) => void;
}) => {
  const set = (k: keyof Address, v: string) => {
    setAddress({ ...address, [k]: v });
    if (errors[k]) clearError(k);
  };
  const props = (k: keyof Address) => ({
    id: `addr-${k}`,
    value: address[k] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value),
    onBlur: () => onBlurField(k),
    "aria-invalid": !!errors[k],
  });
  const problems = (Object.keys(LABELS) as (keyof Address)[]).filter((k) => errors[k]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Shipping address</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        We'll deliver (and install, if chosen) your battery at this address. Fields marked{" "}
        <span className="text-primary font-semibold">*</span> are required.
      </p>

      {problems.length > 0 && (
        <div role="alert" className="mt-4 flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-destructive">Please fix {problems.length} field{problems.length > 1 ? "s" : ""} to continue:</div>
            <ul className="mt-1 list-disc pl-4 text-destructive/90">
              {problems.map((k) => (
                <li key={k}>
                  <a href={`#addr-${k}`} className="underline" onClick={(e) => { e.preventDefault(); document.getElementById(`addr-${k}`)?.focus(); }}>
                    {LABELS[k]}
                  </a>
                  : {errors[k]}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <Field label="Full name" required error={errors.fullName} help="Name of the person receiving the battery.">
          <Input {...props("fullName")} placeholder="e.g. Ravi Kumar" maxLength={80} autoComplete="name" />
        </Field>
        <Field label="Mobile number" required error={errors.phone} help="10-digit mobile for delivery updates — +91 not needed.">
          <Input {...props("phone")} placeholder="e.g. 98765 43210" inputMode="tel" maxLength={15} autoComplete="tel" />
        </Field>
        <Field label="Email" required className="sm:col-span-2" error={errors.email} help="Your order confirmation and invoice are sent here.">
          <Input {...props("email")} type="email" placeholder="e.g. ravi@example.com" maxLength={120} autoComplete="email" />
        </Field>
        <Field label="Address line 1" required className="sm:col-span-2" error={errors.line1} help="House / flat number, building name and street (at least 5 characters).">
          <Input {...props("line1")} placeholder="e.g. Flat 402, Green Heights, 12th Main Road" maxLength={120} autoComplete="address-line1" />
        </Field>
        <Field label="Address line 2" className="sm:col-span-2" error={errors.line2} help="Optional — area, colony or locality.">
          <Input {...props("line2")} placeholder="e.g. Indiranagar 2nd Stage" maxLength={120} autoComplete="address-line2" />
        </Field>
        <Field label="Landmark" required error={errors.landmark} help="A well-known place nearby so our team can find you.">
          <Input {...props("landmark")} placeholder="e.g. Opposite Reliance Smart" maxLength={80} />
        </Field>
        <Field label="PIN code" required error={errors.pincode} help="6-digit PIN code of the delivery address.">
          <Input
            {...props("pincode")}
            onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="e.g. 560038"
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </Field>
        <Field label="City" required error={errors.city} help="Town or city name.">
          <Input {...props("city")} placeholder="e.g. Bengaluru" maxLength={60} autoComplete="address-level2" />
        </Field>
        <Field label="State" required error={errors.state} help="Choose from the list.">
          <Select
            value={address.state || undefined}
            onValueChange={(v) => {
              set("state", v);
              onBlurField("state");
            }}
          >
            <SelectTrigger id="addr-state" aria-invalid={!!errors.state} onBlur={() => onBlurField("state")}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="GSTIN"
          className="sm:col-span-2"
          error={errors.gstin}
          help="Optional — only for businesses that want GST input credit. 15 characters, e.g. 29ABCDE1234F1Z5."
        >
          <Input
            {...props("gstin")}
            onChange={(e) => set("gstin", e.target.value.toUpperCase().slice(0, 15))}
            placeholder="e.g. 29ABCDE1234F1Z5"
            maxLength={15}
            className="uppercase tracking-wider"
          />
        </Field>
      </div>
    </div>
  );
};
