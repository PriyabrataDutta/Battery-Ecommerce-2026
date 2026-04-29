# Phone-first customer auth

Goal: every customer has a verified phone number on file. Email stays as the underlying auth identifier (so we don't have to fake anything), but phone is required at signup, usable as a login handle, and verified with a 4-digit code sent by email today (swap to SMS OTP later).

## What changes for the user

**Signup form** (3 required fields + password):

- Full name
- Mobile number (with country code, default +91)
- Email
- Password

**Login form** — single "Email or mobile" field + password. We auto-detect what they typed. Leave the google login as it it.

**4-digit verification step** — right after signup (and on first login of any unverified existing account), we email a 4-digit code. They enter it to unlock the account. Until verified, `/account` and `/checkout` show the verification screen instead of their normal content.

**Existing customers without a phone** — on next login they hit a blocking "Add your mobile number" screen before they can use the dashboard or checkout.

## Database changes

Add to `profiles`:

- `phone_verified boolean not null default false`
- `phone_verified_at timestamptz`
- unique index on `lower(phone)` (partial, where phone is not null) so phone login lookups are unambiguous

New table `phone_verification_codes`:

- `user_id uuid` (FK auth.users, cascade)
- `code_hash text` (sha256 of the 4-digit code — never store the raw code)
- `expires_at timestamptz` (10 minutes)
- `attempts int default 0` (lock after 5)
- `created_at timestamptz default now()`
- RLS: only the user themselves can select/insert/delete their own row; staff read-only.

Update `handle_new_user()` trigger to also write `phone` from `raw_user_meta_data->>'phone'` into `profiles.phone` at signup.

New RPC `lookup_email_by_phone(_phone text) returns text` (security definer) — used by the login form to translate a phone number to the email Supabase Auth needs. Returns null if no match. Rate-limited via a simple per-IP/per-minute check is out of scope for v1.

New RPC `verify_phone_code(_code text) returns boolean` (security definer) — hashes the code, compares against the user's row in `phone_verification_codes`, increments attempts on failure, on success sets `profiles.phone_verified = true` and deletes the code row.

## Edge function

`send-phone-verification-code` (new) — called from the client after signup or when the user requests a resend:

1. Generates a random 4-digit code.
2. Stores its sha256 hash + 10-minute expiry in `phone_verification_codes` (upserts on user_id).
3. Sends an email to the authenticated user via Lovable's transactional email system with the code and the phone number it's confirming ("Use code 4821 to verify +91 98xxx xxxxx").
4. Returns `{ ok: true }`.

This requires the project's email domain + transactional email infra. If that isn't already set up, the setup dialog will be shown during build and we'll scaffold `send-transactional-email` first.

## Frontend changes

`src/pages/Auth.tsx`

- Add phone input (with country-code prefix, default +91) to the signup form, required, validated as 10-15 digits.
- Replace the sign-in "Email" input with "Email or mobile". On submit: if it parses as a phone, call `lookup_email_by_phone` RPC and use the returned email; otherwise treat as email.
- After a successful signup, route to `/verify-phone` instead of showing the "check your inbox" toast (we still rely on Supabase email confirmation, but the 4-digit step is for *phone ownership*, sent over email until SMS lands).

`src/pages/VerifyPhone.tsx` (new) — simple 4-input code field, "Resend code" button (60s cooldown), calls `verify_phone_code` RPC. On success, navigates to the original `next` destination.

`src/hooks/useAuth.ts`

- Extend `signUp` to accept `phone` and pass it in `options.data` so the trigger picks it up.
- Add `phoneVerified: boolean` to the returned state (read from `profiles` after auth resolves, alongside the existing staff check).
- Add `signInWithIdentifier(identifier, password)` helper that does the phone-to-email lookup.

`src/components/auth/RequirePhoneVerified.tsx` (new wrapper) — used in `App.tsx` around `/account` and `/checkout`. If user is logged in but `phoneVerified` is false OR `profiles.phone` is null, redirect to `/verify-phone` (or `/add-phone` if phone is missing entirely).

`src/pages/AddPhone.tsx` (new) — for legacy accounts. Single phone input, on submit writes to `profiles.phone` then triggers the same verification flow.

`src/App.tsx` — register `/verify-phone` and `/add-phone` routes; wrap `/account` and `/checkout` with `RequirePhoneVerified`.

## Why we keep email as the auth identifier

Lovable Cloud auth needs either an email or an SMS provider. SMS OTP isn't enabled on this project yet, so going phone-only would force us to invent synthetic emails like `9198xxx@example.com` — messy, and a pain to migrate later. Keeping email as the real identifier means: (a) password reset, Google sign-in, and email confirmation all keep working unchanged; (b) when you turn on SMS OTP later, we just swap the `send-phone-verification-code` function from "email the code" to "SMS the code" — no schema change, no data migration.

## Out of scope for this round

- True SMS OTP (planned follow-up — flip a single line in the edge function).
- Phone number change flow with re-verification (we'll add when needed).
- Rate-limiting the lookup-by-phone RPC (basic; can be hardened later).