/**
 * Admin "Remember me" + idle-timeout helpers.
 *
 * The Supabase client is hard-coded to localStorage (auto-generated file).
 * To emulate session-only login when "Remember me" is unchecked, we:
 *   1. On login, write a flag to sessionStorage marking the session as "ephemeral".
 *   2. On every app load, if a Supabase session exists in localStorage but the
 *      ephemeral flag is set AND sessionStorage no longer has the matching marker
 *      (i.e. browser was closed), sign the user out.
 *   3. Track last-activity timestamp; if idle > IDLE_TIMEOUT_MS for ephemeral
 *      sessions, sign out.
 */

const REMEMBER_KEY = "admin.remember_me";          // localStorage: "1" | absent
const EPHEMERAL_KEY = "admin.session_ephemeral";    // sessionStorage marker
const ACTIVITY_KEY = "admin.last_activity";         // localStorage timestamp

// Default 30 minutes. Override at runtime by writing a row to public.site_settings
// with key='admin_idle_timeout_minutes' and value={"minutes": <number>}.
const DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const MIN_TIMEOUT_MS = 60 * 1000;          // 1 minute floor (sanity)
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hour ceiling

let currentTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS;

export function getIdleTimeoutMs(): number {
  return currentTimeoutMs;
}

export function setIdleTimeoutMinutes(minutes: number) {
  if (typeof minutes !== "number" || !isFinite(minutes)) return;
  const ms = minutes * 60 * 1000;
  currentTimeoutMs = Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, ms));
}

/** Back-compat constant — prefer getIdleTimeoutMs(). */
export const IDLE_TIMEOUT_MS = DEFAULT_IDLE_TIMEOUT_MS;

export function setRememberMe(remember: boolean) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, "1");
    sessionStorage.removeItem(EPHEMERAL_KEY);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.setItem(EPHEMERAL_KEY, "1");
  }
  touchActivity();
}

export function isRemembered(): boolean {
  return localStorage.getItem(REMEMBER_KEY) === "1";
}

export function isEphemeralSession(): boolean {
  // Session was non-remembered AND this tab still has the marker (still alive).
  return sessionStorage.getItem(EPHEMERAL_KEY) === "1";
}

/**
 * Returns true if a session was started as ephemeral but the browser/tab was
 * closed (sessionStorage cleared) — meaning the session in localStorage is
 * stale and should be invalidated.
 */
export function isOrphanedEphemeralSession(): boolean {
  return !isRemembered() && !isEphemeralSession() && hasActivityRecord();
}

export function touchActivity() {
  localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
}

function hasActivityRecord(): boolean {
  return localStorage.getItem(ACTIVITY_KEY) !== null;
}

export function isIdleExpired(): boolean {
  if (isRemembered()) return false; // remembered sessions don't idle-expire
  const last = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0);
  if (!last) return false;
  return Date.now() - last > IDLE_TIMEOUT_MS;
}

export function clearAdminSessionFlags() {
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(ACTIVITY_KEY);
  sessionStorage.removeItem(EPHEMERAL_KEY);
}
