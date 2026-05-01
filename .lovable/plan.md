## Goal

Clean up the top black utility bar in the header. The logged-in email and sign-out controls are redundant now that the user icon has a full account dropdown. Replace that right-side block with the existing Phone number and WhatsApp shortcut, and make sure both show on mobile too.

## Scope

Single file: `src/components/layout/Header.tsx` (the utility bar block, lines ~80–110).

## Changes

1. Remove from the top bar:
   - Logged-in user email link (`{user.email}` → `/account`)
   - Sign-out button
   - "Sign in" fallback link
   - "Have a Question?" link (it duplicates Contact and the visible Request Call Back button)

2. Keep and reposition Phone + WhatsApp:
   - Show the phone number `+91 99999 99999` (tel: link, Phone icon)
   - Show "WhatsApp" (wa.me link, MessageCircle icon)
   - Visible on all breakpoints (drop the `hidden sm:flex` gating so mobile sees them too)
   - On mobile only, hide the digits and keep the icon + short label so the bar doesn't wrap; show full number from `sm` upward

3. Layout:
   - Bar stays full-width black (`bg-ink text-white text-xs`), height `h-9`
   - Group both contact items on the left
   - Add a short tagline on the right that's only visible from `md` upward, e.g. "Free shipping & doorstep installation across India" — keeps the bar visually balanced on desktop without clutter on phones
   - On mobile, the two contact items center-justify so the bar doesn't look empty

4. Remove now-unused imports if any become dead (`LogOut` is still used inside the user dropdown menu, so it stays; `useAuth` destructuring no longer needs `signOut` for the top bar but still needs it for the dropdown — no import changes needed)

## Result

```text
Mobile (<sm):
[ ☎ Call  |  💬 WhatsApp ]                 (centered, compact)

Desktop (md+):
[ ☎ +91 99999 99999   💬 WhatsApp ]   ...   Free shipping & doorstep installation
```

The user's email and sign-out remain easily accessible via the user icon dropdown in the main header row.
