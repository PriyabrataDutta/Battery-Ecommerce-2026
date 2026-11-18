-- Server-side rate limiting for endpoints we own (edge functions), plus a
-- sign-up circuit breaker. Supabase Auth already rate-limits sign-ups/sign-ins
-- per IP (Dashboard → Authentication → Rate Limits) and checks the Turnstile
-- CAPTCHA once enabled (Authentication → Bot and Abuse Protection).

CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  hits int NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;  -- no policies: service role only
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

-- Fixed-window counter. Returns true while `key` is within `p_max` hits per window.
-- ponytail: fixed windows allow up to 2×p_max across a window boundary; fine for abuse control.
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_max int, p_window_seconds int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  v_hits int;
BEGIN
  INSERT INTO rate_limits AS r (key, window_start, hits) VALUES (p_key, v_window, 1)
  ON CONFLICT (key, window_start) DO UPDATE SET hits = r.hits + 1
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_max;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.rate_limit_hit(text, int, int) FROM PUBLIC, anon, authenticated;

SELECT cron.schedule('purge-rate-limits', '17 3 * * *',
  $$DELETE FROM public.rate_limits WHERE window_start < now() - interval '2 days'$$);

-- Circuit breaker: refuse new customer accounts during a mass sign-up burst
-- (bots that get past the CAPTCHA). Normal traffic is far below this.
CREATE OR REPLACE FUNCTION public.tg_signup_circuit_breaker()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '10 minutes') >= 60 THEN
    RAISE EXCEPTION 'Too many sign-ups right now. Please try again in a few minutes.' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_signup_circuit_breaker() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_signup_circuit_breaker ON auth.users;
CREATE TRIGGER trg_signup_circuit_breaker
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.tg_signup_circuit_breaker();
