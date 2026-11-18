/**
 * Cloudflare Turnstile "security check" for auth forms.
 *
 * Off until VITE_TURNSTILE_SITE_KEY is set (Vercel env). Supabase verifies the
 * token server-side once CAPTCHA is enabled in Authentication → Bot and Abuse
 * Protection — and then requires it on every sign-up, sign-in and reset call,
 * so every form calling those must render `widget`.
 *
 * The widget is (re)rendered whenever its box mounts — forms that appear after a
 * loading spinner, tab switches and "forgot password" toggles all get a fresh
 * widget. Tokens are single-use: call reset() after each attempt.
 */
import { useCallback, useRef, useState } from "react";

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

let scriptLoad: Promise<TurnstileApi> | null = null;
const loadScript = () =>
  (scriptLoad ??= new Promise<TurnstileApi>((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing")));
    s.onerror = () => {
      scriptLoad = null;
      s.remove();
      reject(new Error("Security check failed to load"));
    };
    document.head.appendChild(s);
  }));

export function useCaptcha() {
  const enabled = !!SITE_KEY;
  const [token, setToken] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const widgetId = useRef<string | null>(null);
  const el = useRef<HTMLDivElement | null>(null);
  const tokenRef = useRef<string | null>(null);
  const waiters = useRef<((t: string | null) => void)[]>([]);

  const setTok = useCallback((t: string | null) => {
    tokenRef.current = t;
    setToken(t);
    if (t) waiters.current.splice(0).forEach((w) => w(t));
  }, []);

  const mount = useCallback(
    (node: HTMLDivElement | null) => {
      // Box removed: drop its widget.
      if (!node) {
        if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
        widgetId.current = null;
        el.current = null;
        setTok(null);
        return;
      }
      el.current = node;
      setFailed(false);
      loadScript()
        .then((ts) => {
          if (el.current !== node || widgetId.current) return; // unmounted or already rendered
          widgetId.current = ts.render(node, {
            sitekey: SITE_KEY,
            theme: "light",
            size: "flexible",
            retry: "auto",
            "refresh-expired": "auto",
            callback: (t: string) => setTok(t),
            "expired-callback": () => setTok(null),
            "error-callback": () => {
              setTok(null);
              setFailed(true);
              return true; // handled: Turnstile retries on its own
            },
          });
        })
        .catch(() => setFailed(true));
    },
    [setTok],
  );

  const reset = useCallback(() => {
    setTok(null);
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
  }, [setTok]);

  /** Token to send with the auth call; waits up to `ms` if verification is still running. */
  const getToken = useCallback(
    (ms = 8000): Promise<string | undefined> => {
      if (!enabled) return Promise.resolve(undefined);
      if (tokenRef.current) return Promise.resolve(tokenRef.current);
      return new Promise((resolve) => {
        const done = (t: string | null) => resolve(t ?? undefined);
        waiters.current.push(done);
        setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== done);
          resolve(tokenRef.current ?? undefined);
        }, ms);
      });
    },
    [enabled],
  );

  const retry = () => {
    if (el.current) {
      const node = el.current;
      mount(null);
      mount(node);
    }
  };

  const widget = enabled ? (
    <div>
      <div ref={mount} className="w-full min-h-[65px]" />
      {failed && !token && (
        <p className="text-xs text-muted-foreground mt-1">
          Security check didn't load.{" "}
          <button type="button" onClick={retry} className="underline hover:text-primary">
            Retry security check
          </button>
        </p>
      )}
    </div>
  ) : null;

  /** Ready to submit: captcha off, or a token is present. */
  const ready = !enabled || !!token;
  return { enabled, token: token ?? undefined, ready, reset, widget, getToken };
}
