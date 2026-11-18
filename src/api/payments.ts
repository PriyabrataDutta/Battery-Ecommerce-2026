import { supabase } from "./client";

export interface PaymentMethods {
  cod: boolean;
  online: boolean;
  mode: "test" | "live";
}

/** Methods switched on in Admin → Settings → Payment (online also needs saved keys). */
export async function getPaymentMethods(): Promise<PaymentMethods> {
  const { data, error } = await supabase.rpc("available_payment_methods");
  if (error) throw error;
  return data as unknown as PaymentMethods;
}

async function cashfreeOrder<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("cashfree-order", { body });
  // Function errors carry a JSON body with { error }; surface that message.
  if (error) {
    const ctx = (error as { context?: Response }).context;
    const msg = ctx ? (await ctx.json().catch(() => null))?.error : null;
    throw new Error(msg ?? error.message);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

/** Creates (or reuses) the Cashfree order and returns its checkout session. */
export const createCashfreePayment = (orderNumber: string) =>
  cashfreeOrder<{ payment_session_id: string; mode: "sandbox" | "production" }>({ action: "create", order_number: orderNumber });

/** Asks the server to confirm the payment with Cashfree (never trusts the browser). */
export const verifyCashfreePayment = (orderNumber: string) =>
  cashfreeOrder<{ state: string; status: string; payment_status: "unpaid" | "paid" | "failed" | "refunded" }>({
    action: "verify",
    order_number: orderNumber,
  });

/** Staff: check the saved Cashfree keys work. */
export const pingCashfree = () => cashfreeOrder<{ ok: boolean; mode: string; error?: string }>({ action: "ping" });
