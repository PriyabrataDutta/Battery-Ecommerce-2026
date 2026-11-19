import { Navigate } from "react-router-dom";
import { useSavedOrder } from "./hooks/useSavedOrder";
import { SuccessHeader } from "./components/SuccessHeader";
import { OrderTracker } from "./components/OrderTracker";
import { OrderItems } from "./components/OrderItems";
import { AddressBlocks } from "./components/AddressBlocks";
import { PaymentSummary } from "./components/PaymentSummary";
import { PaymentStatusBanner } from "./components/PaymentStatusBanner";

/**
 * OrderConfirmation (orchestrator)
 * ==============================================================
 * Post-checkout "thank you" page. Reads a snapshot of the just-
 * placed order from sessionStorage (written by the Checkout flow)
 * and renders a celebratory summary. Direct visits with no order
 * snapshot are redirected to "/".
 *
 * FILE MAP
 *   index.tsx                    ← you are here (load + redirect)
 *   hooks/
 *     useSavedOrder.ts           ← reads sessionStorage payload
 *   lib/
 *     types.ts                   ← SavedOrder shape + storage key
 *   components/
 *     SuccessHeader.tsx          ← hero, order #, primary CTAs
 *     OrderTracker.tsx           ← 3-step progress + slot banner
 *     OrderItems.tsx             ← line items list
 *     AddressBlocks.tsx          ← shipping address + contact
 *     PaymentSummary.tsx         ← right-rail totals + promo
 *
 * COMMON EDITS
 *   • Add a tracker step       → components/OrderTracker.tsx
 *   • Tweak totals / promo UI  → components/PaymentSummary.tsx
 *   • Show extra address field → components/AddressBlocks.tsx
 *   • Swap data source to API  → replace useSavedOrder() with a
 *                                React Query hook; keep return
 *                                shape (undefined | null | order).
 *
 * The Checkout flow writes the snapshot in
 *   src/pages/checkout/index.tsx → sessionStorage["kachi_last_order"]
 * Keep `lib/types.ts` in sync with that writer.
 */
const OrderConfirmation = () => {
  const order = useSavedOrder();

  if (order === undefined) {
    return <div className="container-x py-20 text-center text-muted-foreground">Loading…</div>;
  }
  if (order === null) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container-x py-8 sm:py-12">
      {order.payment.id === "online" && <PaymentStatusBanner orderNumber={order.orderNumber} />}
      <SuccessHeader order={order} />
      <OrderTracker order={order} />

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mt-6 items-start">
        <section className="space-y-4">
          <OrderItems items={order.items} />
          <AddressBlocks address={order.address} />
        </section>
        <PaymentSummary payment={order.payment} totals={order.totals} />
      </div>
    </div>
  );
};

export default OrderConfirmation;
