/**
 * Cloudflare Turnstile "security check" for auth forms.
 *
 * Off until VITE_TURNSTILE_SITE_KEY is set (Vercel env). Supabase verifies the
 * token server-side once CAPTCHA is enabled in Authentication → Bot and Abuse
 * Protection — and then requires it on every sign-up, sign-in and reset call,
 * so every form calling those must render this.
 *
 * Tokens are single-use: call reset() after each attempt.
 */
import { useCallback, useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoad: Promise<void> | null = null;
const loadScript = () =>
  (scriptLoad ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptLoad = null;
      reject(new Error("Security check failed to load"));
    };
    document.head.appendChild(s);
  }));

export function useCaptcha() {
  const enabled = !!SITE_KEY;
  const [token, setToken] = useState<string | null>(null);
  const holder = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    loadScript()
      .then(() => {
        if (cancelled || !holder.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: SITE_KEY,
          theme: "light",
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(null),
          "error-callback": () => setToken(null),
        });
      })
      .catch(() => setToken(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [enabled]);

  const reset = useCallback(() => {
    setToken(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, []);

  const widget = enabled ? <div ref={holder} className="min-h-[65px] flex justify-center" /> : null;

  /** Ready to submit: captcha off, or a token is present. */
  const ready = !enabled || !!token;
  return { enabled, token: token ?? undefined, ready, reset, widget };
}
