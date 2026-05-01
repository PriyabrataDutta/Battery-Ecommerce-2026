/**
 * ProductDetail — Trust badge.
 *
 * Used in the right column under the CTAs to call out warranty / quality.
 */
import type { ShieldCheck } from "lucide-react";

export function Trust({
  Icon,
  label,
}: {
  Icon: typeof ShieldCheck;
  label: string;
}) {
  return (
    <div className="bg-white border border-line p-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="font-semibold text-[11px] leading-tight">{label}</span>
    </div>
  );
}
