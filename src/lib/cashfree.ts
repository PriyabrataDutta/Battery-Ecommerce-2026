import { createCashfreePayment } from "@/api/payments";

// Cashfree requires loading its checkout script from its own CDN (PCI), not bundling it.
const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

type CashfreeFactory = (opts: { mode: "sandbox" | "production" }) => {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown>;
};

let sdk: Promise<CashfreeFactory> | null = null;
function loadSdk(): Promise<CashfreeFactory> {
  sdk ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.onload = () => resolve((window as unknown as { Cashfree: CashfreeFactory }).Cashfree);
    s.onerror = () => {
      sdk = null;
      reject(new Error("Could not load the payment page. Check your connection and try again."));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

/** Sends the shopper to Cashfree's hosted checkout for this order. Returns here via return_url. */
export async function payOnline(orderNumber: string) {
  const [{ payment_session_id, mode }, Cashfree] = await Promise.all([createCashfreePayment(orderNumber), loadSdk()]);
  await Cashfree({ mode }).checkout({ paymentSessionId: payment_session_id, redirectTarget: "_self" });
}
