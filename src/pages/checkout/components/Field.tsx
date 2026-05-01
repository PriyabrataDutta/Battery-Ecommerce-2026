/**
 * Field — labelled input wrapper used throughout checkout.
 *
 * Pure presentational. Renders a label, the child input, and either an
 * error message or a help hint underneath.
 */
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export const Field = ({
  label,
  required,
  children,
  className,
  error,
  help,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
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
