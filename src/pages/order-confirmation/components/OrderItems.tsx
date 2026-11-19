import { Link } from "react-router-dom";
import { formatINR } from "@/lib/format";
import { lineKey } from "@/hooks/useCart";
import type { SavedOrder } from "../lib/types";

/**
 * OrderItems
 * --------------------------------------------------------------
 * Lists each line item from the placed order with image, SKU,
 * quantity, exchange marker, and per-line / per-unit price.
 */
export function OrderItems({ items }: { items: SavedOrder["items"] }) {
  return (
    <div className="surface p-5 md:p-7">
      <h2 className="font-display-tight font-bold text-xl text-ink mb-4">
        Items ({items.length})
      </h2>
      <ul className="divide-y divide-line">
        {items.map((it) => (
          <li
            key={lineKey({ id: it.id })}
            className="py-4 flex gap-4 items-center"
          >
            {it.image ? (
              <img
                src={it.image}
                alt={it.name}
                className="h-16 w-16 object-contain bg-muted rounded-xl p-1 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 bg-muted rounded-xl shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <Link
                to={`/product/${it.slug}`}
                className="font-display font-bold text-ink hover:text-primary line-clamp-2"
              >
                {it.name}
              </Link>
              <div className="text-xs text-muted-foreground">
                SKU: {it.sku} · Qty {it.qty}
                {it.withExchange ? " · with exchange" : ""}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold text-ink tabular-nums">{formatINR(it.lineTotal)}</div>
              <div className="text-xs text-muted-foreground">{formatINR(it.unitPrice)} each</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
