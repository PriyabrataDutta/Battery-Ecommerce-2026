# Header

Sticky site-wide header used by `StoreLayout`. The folder follows the same
"thin orchestrator + dumb pieces + co-located lib/hooks" convention used by
the Checkout and Product Detail features.

## File map

```
Header/
├── index.tsx                       Orchestrator. Owns open/close state and composes the sub-pieces.
├── components/
│   ├── UtilityBar.tsx              Top dark strip (phone, WhatsApp, tagline).
│   ├── MainBar.tsx                 Logo, desktop search, action icons, CTA.
│   ├── DesktopNav.tsx              Lower nav + Shop mega menu (lg+).
│   ├── MobileDrawer.tsx            Slide-down nav for <lg screens.
│   ├── MobileSearchOverlay.tsx     Full-screen mobile search (locks body scroll).
│   ├── CartButton.tsx              Cart icon + item-count badge.
│   └── AccountMenu.tsx             Signed-in dropdown OR Login/Signup CTA.
├── hooks/
│   └── useAccountMenu.ts           Hover/focus state machine for the account dropdown.
├── lib/
│   └── nav.ts                      All link data + contact info (single source of truth).
└── README.md                       (this file)
```

## Data flow

```
StoreLayout
  └── <Header />                          ← index.tsx (this folder)
        ├── <UtilityBar />                ← reads contactInfo from lib/nav
        ├── <MainBar />                   ← receives state + setters as props
        │     ├── <CartButton />          ← reads useCart()
        │     └── <AccountMenu />         ← reads useAuth(), useAccountMenu()
        ├── <MobileSearchOverlay />
        ├── <DesktopNav />                ← reads mainNav + shopMegaMenu
        ├── <MobileDrawer />              ← reads mobileNav
        └── <CartDrawer />                ← controlled by cartDrawerOpen state
```

State that affects multiple siblings (`mobileOpen`, `mobileSearchOpen`,
`cartDrawerOpen`) lives in `index.tsx`. State that's local to one sub-tree
(account dropdown timer, mega-menu hover) stays inside that piece.

## How do I…

| Task | Edit |
| --- | --- |
| Add or rename a top-nav link | `lib/nav.ts` → `mainNav` |
| Add a column or item to the Shop mega menu | `lib/nav.ts` → `shopMegaMenu` |
| Add an item to the mobile drawer | `lib/nav.ts` → `mobileNav` |
| Change phone / WhatsApp number / tagline | `lib/nav.ts` → `contactInfo` |
| Add an entry inside the account dropdown | `components/AccountMenu.tsx` |
| Gate something behind admin role | use `isStaff` from `useAuth()` (see AccountMenu) |
| Tweak header height or spacing | `components/MainBar.tsx` |
| Replace the logo | swap `src/assets/kachi-logo.png` (used by `MainBar`) |
| Change cart-drawer breakpoint | `components/CartButton.tsx` (currently `< 1024px`) |

## Conventions

- Shared icon-button look: `text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
- Tap targets are 44px (`h-11 w-11`) on mobile per WCAG, tightened to 40px on `sm+`.
- Always use semantic tokens (`text-ink`, `bg-primary`, `border-line`) — never raw colors.
- Link/menu data is **declarative** (in `lib/nav.ts`), JSX is just a renderer.
