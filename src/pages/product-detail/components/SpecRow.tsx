/**
 * ProductDetail — specs table row.
 *
 * Returns null when value is empty so callers can pass optional fields
 * unconditionally without rendering empty rows.
 */
import { forwardRef } from "react";

export const SpecRow = forwardRef<
  HTMLTableRowElement,
  { label: string; value?: string | null }
>(function SpecRow({ label, value }, ref) {
  if (!value) return null;
  return (
    <tr ref={ref} className="border-b border-line">
      <td className="py-2.5 px-3 font-semibold capitalize w-1/3 bg-muted/30">{label}</td>
      <td className="py-2.5 px-3 text-ink-soft">{value}</td>
    </tr>
  );
});
