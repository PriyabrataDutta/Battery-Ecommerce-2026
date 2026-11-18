/**
 * DeliveryStep — Step 2 of checkout.
 *
 * Picks a delivery method, a date and a time slot. The slot list and the
 * minimum delivery-notes length both depend on the selected method:
 *   - standard / express  → STANDARD_SLOTS (no notes requirement)
 *   - installation        → INSTALLATION_SLOTS (notes minimums per slot)
 *
 * Validation lives in ../lib/validation.ts (`validateSchedule`).
 */
import { CalendarIcon, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "./Field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import {
  earliestDeliveryDate,
  findSlot,
  isDateDisabled,
  slotsForDelivery,
} from "../lib/constants";
import type { DeliveryId, DeliveryOption, SlotId } from "../lib/types";

export const DeliveryStep = ({
  options,
  delivery,
  setDelivery,
  notes,
  setNotes,
  notesError,
  deliveryDate,
  setDeliveryDate,
  slot,
  setSlot,
  scheduleError,
}: {
  options: DeliveryOption[];
  delivery: DeliveryId;
  setDelivery: (d: DeliveryId) => void;
  notes: string;
  setNotes: (v: string) => void;
  notesError?: string;
  deliveryDate: Date | undefined;
  setDeliveryDate: (d: Date | undefined) => void;
  slot: SlotId | "";
  setSlot: (s: SlotId | "") => void;
  scheduleError: string;
}) => {
  const earliest = earliestDeliveryDate(delivery);
  const slots = slotsForDelivery(delivery);
  const selectedSlot = findSlot(slot);
  const notesLength = notes.trim().length;
  const notesMin = selectedSlot?.notesMin ?? 0;
  const notesShortfall = Math.max(0, notesMin - notesLength);
  const installation = delivery === "installation";

  return (
    <div>
      <div className="flex items-center gap-2">
        <Truck className="h-5 w-5 text-primary" />
        <h2 className="font-display-tight text-xl font-bold">Delivery method</h2>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Choose how you'd like your battery delivered.
      </p>

      <RadioGroup
        value={delivery}
        onValueChange={(v) => setDelivery(v as DeliveryId)}
        className="mt-6 space-y-3"
      >
        {options.map((o) => {
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

      {/* Schedule */}
      <div className="mt-8 border-t border-line pt-6">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <h3 className="font-display-tight text-lg font-bold">
            {delivery === "installation"
              ? "Schedule your installation"
              : "Schedule your delivery"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Earliest available date for this method:{" "}
          <span className="font-semibold text-ink">{format(earliest, "EEE, dd MMM yyyy")}</span>
          {delivery === "installation" && " · Sundays unavailable for installation"}
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-display font-semibold uppercase tracking-wide">
              Preferred date <span className="text-primary">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "mt-1.5 w-full justify-start text-left font-normal",
                    !deliveryDate && "text-muted-foreground",
                  )}
                  aria-invalid={!!scheduleError && !deliveryDate}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "EEE, dd MMM yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => isDateDisabled(date, delivery)}
                  defaultMonth={deliveryDate ?? earliest}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className="text-xs font-display font-semibold uppercase tracking-wide">
              {delivery === "installation"
                ? "Installation time slot"
                : "Preferred time slot"}{" "}
              <span className="text-primary">*</span>
            </Label>
            <RadioGroup
              value={slot}
              onValueChange={(v) => setSlot(v as SlotId)}
              aria-invalid={!!scheduleError && !slot}
              className={cn(
                "mt-1.5 grid gap-2",
                delivery === "installation" ? "grid-cols-1" : "grid-cols-2",
              )}
            >
              {slots.map((s) => {
                const active = slot === s.id;
                return (
                  <label
                    key={s.id}
                    htmlFor={`slot-${s.id}`}
                    className={[
                      "flex items-start gap-2 p-3 border cursor-pointer transition-colors text-left",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-line hover:border-ink-soft",
                    ].join(" ")}
                  >
                    <RadioGroupItem id={`slot-${s.id}`} value={s.id} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-display font-semibold flex items-center gap-1.5 flex-wrap">
                        <Clock className="h-3 w-3 text-ink-soft shrink-0" />
                        <span>{s.label}</span>
                        {s.notesMin > 0 && (
                          <span className="ml-auto text-[10px] font-display font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5">
                            Notes ≥ {s.notesMin}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{s.window}</div>
                      {s.notesHint && active && (
                        <div className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">
                          {s.notesHint}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        {/* Notes sit next to the slot because the slot decides whether they're required. */}
        <div className="mt-6">
          <Field
            label={installation ? "Installation notes" : "Delivery notes"}
            required={notesMin > 0}
            error={notesError}
            help={
              notesMin > 0
                ? `Required for "${selectedSlot?.label}" — at least ${notesMin} characters.`
                : installation
                  ? "Pick a time slot above to see what's required. Helpful details speed up installation."
                  : "Optional — anything that helps us deliver smoothly."
            }
          >
            <Textarea
              id="addr-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              aria-invalid={!!notesError}
              placeholder={
                installation
                  ? "e.g. Maruti Swift 2019 petrol, parked in basement B2 slot 14, gate code 4521, lift available, contact Ravi 98765 43210"
                  : "e.g. Call 10 minutes before arriving, leave with the security guard if I'm not home"
              }
            />
          </Field>
          <div className="mt-1.5 flex flex-wrap items-start justify-between gap-2 text-xs">
            <div className="text-muted-foreground">
              {installation ? (
                <>
                  <span className="font-semibold text-ink">Please include:</span>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5">
                    <li>Vehicle make, model and fuel type (e.g. Hyundai Creta diesel)</li>
                    <li>Where the vehicle is parked (street, basement level, slot number)</li>
                    <li>Building or gate access — gate code, intercom, lift</li>
                    <li>Contact person at the location, if different from you</li>
                  </ul>
                </>
              ) : (
                <span>Examples: best time to call, gate/security instructions, floor and lift details.</span>
              )}
            </div>
            <div
              className={cn(
                "shrink-0 font-semibold",
                notesMin > 0 ? (notesShortfall > 0 ? "text-amber-700" : "text-success") : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {notesMin > 0
                ? notesShortfall > 0
                  ? `${notesLength} / ${notesMin} min — ${notesShortfall} more`
                  : `${notesLength} characters ✓`
                : `${notesLength} / 500`}
            </div>
          </div>
        </div>

        {scheduleError && (
          <p className="mt-3 text-xs text-destructive font-medium" role="alert">
            {scheduleError}
          </p>
        )}
      </div>
    </div>
  );
};
