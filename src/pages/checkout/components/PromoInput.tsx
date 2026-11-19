/**
 * PromoInput — apply / remove a promo code.
 *
 * Self-contained: owns its input field, validation message, and the "Try
 * KACHI10" hint. Apply / remove are passed in by the parent so this
 * component doesn't need to know how discounts are calculated.
 */
import { Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Promo } from "../lib/types";

export const PromoInput = ({
  appliedPromo,
  promoInput,
  setPromoInput,
  promoError,
  clearError,
  onApply,
  onRemove,
}: {
  appliedPromo: Promo | null;
  promoInput: string;
  setPromoInput: (v: string) => void;
  promoError: string;
  clearError: () => void;
  onApply: () => void;
  onRemove: () => void;
}) => {
  return (
    <div className="border-t border-line mt-4 pt-4">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="h-4 w-4 text-primary" />
        <span className="text-sm font-display font-semibold text-ink">
          Promo code
        </span>
      </div>

      {appliedPromo ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-success/10 border border-success/30 px-3 py-2">
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
            onClick={onRemove}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
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
                if (promoError) clearError();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onApply();
                }
              }}
              placeholder="Enter code"
              className="font-mono uppercase tracking-wider"
              maxLength={20}
              aria-invalid={!!promoError}
            />
            <Button type="button" variant="outline" onClick={onApply} disabled={!promoInput.trim()}>
              Apply
            </Button>
          </div>
          {promoError && (
            <p className="mt-1 text-xs text-destructive font-medium" role="alert">
              {promoError}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
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
  );
};
