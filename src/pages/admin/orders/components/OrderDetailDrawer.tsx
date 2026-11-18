import { useEffect, useState } from "react";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatINR } from "@/lib/format";
import { ORDER_STATUSES, type AdminOrderRow, type OrderStatus } from "@/api/admin/orders";
import { useAdminOrderItems, useSetOrderStatus, useSetOrderNotes } from "../hooks/useAdminOrders";
import { Loader2 } from "lucide-react";

/**
 * OrderDetailDrawer
 * --------------------------------------------------------------
 * Slide-out detail view for a single order. Shows customer +
 * shipping info, line items, totals, and lets staff change the
 * status and edit internal notes.
 *
 * Status / notes mutations live in `useAdminOrders.ts` — this
 * component only wires inputs to those hooks.
 */
export function OrderDetailDrawer({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: AdminOrderRow | null;
}) {
  const itemsQ = useAdminOrderItems(order?.id ?? null);
  const setStatus = useSetOrderStatus();
  const setNotes = useSetOrderNotes();
  const [notes, setNotesValue] = useState("");

  useEffect(() => {
    setNotesValue(order?.notes ?? "");
  }, [order?.id, order?.notes]);

  if (!order) {
    return <EntityDrawer open={open} onOpenChange={onOpenChange} title="" size="lg">{null}</EntityDrawer>;
  }

  const address = (order.address ?? {}) as Record<string, string>;
  const handleStatus = (next: OrderStatus) => {
    setStatus.mutate({ id: order.id, status: next, prev: order.status });
  };
  const handleSaveNotes = async () => {
    await setNotes.mutateAsync({ id: order.id, notes });
    onOpenChange(false);
  };

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`Order #${order.order_number ?? order.id.slice(0, 8)}`}
      description={new Date(order.created_at).toLocaleString("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
      })}
      size="xl"
      saveLabel="Save notes"
      saving={setNotes.isPending}
      onSave={handleSaveNotes}
    >
      {/* Status */}
      <div className="bg-muted/40 border border-line rounded-lg p-3 flex items-center justify-between">
        <div>
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <div className="font-display font-bold text-lg capitalize">
            {order.status.replace(/_/g, " ")}
          </div>
        </div>
        <Select
          value={order.status}
          onValueChange={(v) => handleStatus(v as OrderStatus)}
          disabled={setStatus.isPending}
        >
          <SelectTrigger className="h-9 w-[160px] text-xs capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Customer + shipping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card title="Customer">
          <Row label="Name" value={order.customer_name ?? "—"} />
          <Row label="Email" value={order.customer_email ?? "—"} />
          <Row label="Phone" value={order.customer_phone ?? "—"} />
          <Row label="Payment" value={order.payment_method ?? "—"} />
          <Row
            label="Payment status"
            value={
              order.payment_status === "paid"
                ? `Paid${order.paid_at ? ` · ${new Date(order.paid_at).toLocaleString("en-IN")}` : ""}`
                : order.payment_status === "failed"
                  ? "Failed / not completed"
                  : order.payment_method === "Cash on Delivery"
                    ? "Collect cash on delivery"
                    : "Unpaid — do not dispatch"
            }
          />
          {order.payment_ref && <Row label="Cashfree payment ID" value={order.payment_ref} />}
        </Card>
        <Card title="Shipping">
          <Row label="Method" value={order.delivery_label ?? "—"} />
          {order.scheduled_date && (
            <Row
              label="Slot"
              value={`${order.scheduled_date} · ${order.scheduled_slot_label ?? ""}${
                order.scheduled_slot_window ? ` (${order.scheduled_slot_window})` : ""
              }`}
            />
          )}
          <Row
            label="Address"
            value={
              [address.line1, address.line2, address.landmark && `Near ${address.landmark}`, address.city, address.state, address.pincode]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          {address.gstin && <Row label="GSTIN" value={address.gstin} />}
          {address.notes && (
            <div className="pt-1">
              <div className="text-muted-foreground">Customer delivery notes</div>
              <div className="font-medium whitespace-pre-wrap">{address.notes}</div>
            </div>
          )}
        </Card>
      </div>

      {/* Items */}
      <Card title={`Items${itemsQ.data ? ` (${itemsQ.data.length})` : ""}`}>
        {itemsQ.isLoading ? (
          <div className="py-6 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 mx-auto animate-spin" />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {(itemsQ.data ?? []).map((it) => (
              <li key={it.id} className="py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{it.product_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {it.product_sku ?? "—"} · qty {it.qty}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">
                    {formatINR(Number(it.unit_price) * it.qty)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatINR(Number(it.unit_price))} each
                  </div>
                </div>
              </li>
            ))}
            {itemsQ.data && itemsQ.data.length === 0 && (
              <li className="py-3 text-sm text-muted-foreground text-center">No items.</li>
            )}
          </ul>
        )}
      </Card>

      {/* Totals */}
      <Card title="Totals">
        <Row label="Subtotal" value={formatINR(Number(order.subtotal))} />
        {Number(order.discount) > 0 && (
          <Row
            label={`Discount${order.promo_code ? ` (${order.promo_code})` : ""}`}
            value={`−${formatINR(Number(order.discount))}`}
          />
        )}
        <Row label="GST" value={formatINR(Number(order.tax))} />
        <Row
          label="Shipping"
          value={Number(order.shipping) === 0 ? "FREE" : formatINR(Number(order.shipping))}
        />
        <div className="flex justify-between border-t border-line mt-2 pt-2 font-display font-bold text-base">
          <span>Total</span>
          <span>{formatINR(Number(order.total))}</span>
        </div>
      </Card>

      {/* Internal notes */}
      <Card title="Internal notes">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotesValue(e.target.value)}
          placeholder="Visible to staff only — e.g. dispatch instructions."
        />
      </Card>
    </EntityDrawer>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-line rounded-lg p-3">
      <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h3>
      <div className="space-y-1 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right truncate">{value}</span>
    </div>
  );
}
