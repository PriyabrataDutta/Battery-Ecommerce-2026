import { useState } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { UtilityBar } from "./components/UtilityBar";
import { MainBar } from "./components/MainBar";
import { DesktopNav } from "./components/DesktopNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { MobileSearchOverlay } from "./components/MobileSearchOverlay";

/**
 * Header (orchestrator)
 * ==============================================================
 * Sticky top header rendered by `StoreLayout` on every public
 * page. This file is intentionally thin: it owns the *open/close*
 * state of the mobile drawer, mobile search overlay, and cart
 * drawer, and composes the visual sub-components.
 *
 * FILE MAP
 *   index.tsx                  ← you are here (state + composition)
 *   components/
 *     UtilityBar.tsx           ← top dark strip (phone, WhatsApp)
 *     MainBar.tsx              ← logo, search, cart, account
 *     DesktopNav.tsx           ← lower nav + Shop mega menu (≥lg)
 *     MobileDrawer.tsx         ← slide-down nav (<lg)
 *     MobileSearchOverlay.tsx  ← full-screen mobile search
 *     CartButton.tsx           ← cart icon + count badge
 *     AccountMenu.tsx          ← signed-in dropdown / login CTA
 *   hooks/
 *     useAccountMenu.ts        ← hover-with-grace-period state
 *   lib/
 *     nav.ts                   ← all link/menu data + contact info
 *
 * COMMON EDITS
 *   • Add / rename a nav link        → lib/nav.ts
 *   • Change phone / WhatsApp number → lib/nav.ts (contactInfo)
 *   • Change the Shop mega menu      → components/ShopMegaMenu.tsx
 *   • Add an account-menu entry      → components/AccountMenu.tsx
 *   • Tweak layout / spacing only    → components/MainBar.tsx
 *
 * Imported from "./Header" by StoreLayout — barrel works because
 * Vite resolves the directory's index.tsx automatically.
 */
export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/75">
      <UtilityBar />

      <MainBar
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((v) => !v)}
        onOpenMobileSearch={() => setMobileSearchOpen(true)}
        onOpenCartDrawer={() => setCartDrawerOpen(true)}
      />

      <MobileSearchOverlay open={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />

      <DesktopNav />

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Slide-in cart drawer (used on <1024px when the cart icon is tapped) */}
      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </header>
  );
}
