import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { mainNav } from "../lib/nav";
import { ShopMegaMenu } from "./ShopMegaMenu";

/**
 * DesktopNav
 * --------------------------------------------------------------
 * The lower navigation bar visible on `lg` screens and above.
 * Renders top-level links + the "Shop" mega menu + a clearance
 * call-out pinned to the right.
 *
 * Edit links / mega-menu data in `../lib/nav.ts`.
 */
export function DesktopNav() {
  const [shopOpen, setShopOpen] = useState(false);
  const closeTimer = useRef<number>();
  const { pathname, search } = useLocation();

  // Small grace period so moving the mouse from the button to the panel doesn't close it.
  const open = () => { window.clearTimeout(closeTimer.current); setShopOpen(true); };
  const closeSoon = () => { window.clearTimeout(closeTimer.current); closeTimer.current = window.setTimeout(() => setShopOpen(false), 120); };

  useEffect(() => setShopOpen(false), [pathname, search]);
  useEffect(() => {
    if (!shopOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShopOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shopOpen]);

  return (
    <nav className="hidden lg:block border-t border-line/70">
      <div className="container-x relative flex items-center gap-1 h-12">
        {/* First link (Home) */}
        {mainNav.slice(0, 1).map((item) => (
          <TopLink key={item.to} to={item.to} label={item.label} />
        ))}

        {/* Shop with mega menu (panel spans the nav container) */}
        <div onMouseEnter={open} onMouseLeave={closeSoon}>
          <button
            type="button"
            onClick={() => setShopOpen((v) => !v)}
            aria-expanded={shopOpen}
            aria-haspopup="true"
            aria-controls="shop-mega-menu"
            className={`px-3.5 h-9 rounded-full inline-flex items-center gap-1 text-sm font-medium transition-colors ${shopOpen ? "bg-ink text-white" : "text-ink hover:bg-muted"}`}
          >
            Shop <ChevronDown className={`h-3.5 w-3.5 transition-transform ${shopOpen ? "rotate-180" : ""}`} />
          </button>
          {shopOpen && (
            <div id="shop-mega-menu" className="absolute inset-x-4 top-full z-50 pt-2 sm:inset-x-6 lg:inset-x-8">
              <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-elevated animate-fade-in">
                <ShopMegaMenu onNavigate={() => setShopOpen(false)} />
              </div>
            </div>
          )}
        </div>

        {/* Remaining top-level links */}
        {mainNav.slice(1).map((item) => (
          <TopLink key={item.to} to={item.to} label={item.label} />
        ))}

        <NavLink
          to="/category/clearance"
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 h-9 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> Clearance Sale
        </NavLink>
      </div>
    </nav>
  );
}

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3.5 h-9 rounded-full inline-flex items-center text-sm font-medium transition-colors ${
          isActive ? "bg-ink text-white" : "text-ink hover:bg-muted"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
