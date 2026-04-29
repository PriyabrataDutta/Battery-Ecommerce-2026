# Customer auth audit & polish

## What's already working

- `Auth.tsx` has email/password sign-in + sign-up with zod validation, blocks admin emails from using the customer flow.
- `useAuth` hook correctly sets up `onAuthStateChange` BEFORE `getSession()` (no auth race), caches `is_staff`, exposes `signIn` / `signUp` / `signOut`.
- `RequireAuth` gates `/account` and remembers the intended destination via `?next=`.
- `Auth.tsx` already redirects signed-in users to `next` (default `/account`).
- DB has `profiles`, `user_roles`, `handle_new_user` trigger that creates a customer profile + assigns `customer` role on signup. RLS is in place.
- Checkout already uses `RequireAuth` (per earlier work).

## Gaps to fix

1. **Header always shows "Sign in"** even when the user is logged in — confusing. The User icon goes to `/account` regardless of auth state.
2. **No Google sign-in** — Lovable Cloud default for auth is email + Google; only email/password is wired.
3. **No password reset flow** — no "Forgot password?" link, no `/reset-password` page. Without the page, recovery links auto-log the user in without changing the password.
4. **Sign-up emailRedirectTo points to `/`** — after confirming email, user lands on home with no signal. Better: land on `/account` (or `/auth?confirmed=1`).
5. **Post-signup messaging is stale if email auto-confirm is on** — we tell them to check inbox even when no email is sent. Not breaking, but worth a quick check.
6. **No loading state on the User icon** during the brief `loading=true` window — shows a fleeting "Sign in" link before flipping. Minor.

## Proposed changes

### 1. Header auth state (`src/components/layout/Header.tsx`)
- Read `user`, `loading` from `useAuth`.
- Top utility bar: when signed in, replace "Sign in" with the user's email (or first name) linking to `/account`, plus a small "Sign out" button. When loading, render nothing to avoid flicker.
- User icon button: when signed out, link to `/auth` instead of `/account` (so guests don't bounce through `RequireAuth`).

### 2. Add Google sign-in (`src/pages/Auth.tsx`)
- Add a "Continue with Google" button above the email/password tabs.
- Calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: ${window.location.origin}/account } })`.
- Enable Google provider via `configure_social_auth` (no client ID needed — Lovable Cloud handles it).

### 3. Password reset
- Add a "Forgot password?" link on the Sign In tab → opens a small inline form (or routes to `/auth?mode=forgot`) that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/reset-password })`.
- Create `src/pages/ResetPassword.tsx`: detects `type=recovery` in URL hash, shows new-password form, calls `supabase.auth.updateUser({ password })`, then redirects to `/account`.
- Register `/reset-password` as a **public** route in `App.tsx`.

### 4. Signup redirect & confirmation UX
- In `useAuth.signUp`, change `emailRedirectTo` from `${origin}/` to `${origin}/account`.
- After email confirmation lands the user on `/account` already authenticated.

### 5. Dashboard redirect on sign-in
- Already handled (`Auth.tsx` reads `?next=` and falls back to `/account`). I'll add a small toast confirmation and verify checkout's redirect chain (`/checkout` → `/auth?next=/checkout` → back to `/checkout`) still works.

## Auth settings to verify (no code, just config)

- `configure_auth` — keep email confirmation **enabled** (default; matches user-roles knowledge: do NOT auto-confirm unless explicitly asked).
- `configure_auth` — turn on **Password HIBP check** so leaked passwords are blocked at signup. Cheap win.
- `configure_social_auth` — enable **Google** provider.

## Files to touch

- edit `src/components/layout/Header.tsx` — auth-aware top bar + user icon
- edit `src/pages/Auth.tsx` — Google button, "Forgot password?" link
- edit `src/hooks/useAuth.ts` — change signup redirect to `/account`, add `signInWithGoogle`, add `resetPassword`
- create `src/pages/ResetPassword.tsx`
- edit `src/App.tsx` — register `/reset-password` route
- run `configure_social_auth` (Google) and `configure_auth` (HIBP on)

## Out of scope (ask if you want them)

- Phone/SMS sign-in
- Apple sign-in
- Magic-link (passwordless) sign-in
- Custom branded auth emails (would need email-domain setup)
- Profile editing UI inside the dashboard (the page exists but I haven't audited the form — separate task)

## Confirmation needed

- OK to enable **Google sign-in**? (Default per Lovable Cloud guidance.)
- OK to enable **HIBP leaked-password check**?
- Keep **email confirmation required** before sign-in (recommended), or auto-confirm so users can log in immediately?
