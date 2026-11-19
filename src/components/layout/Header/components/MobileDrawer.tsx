import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, BatteryCharging, Calculator, Car, MessageCircle, PhoneCall } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useCarBrands } from "@/hooks/queries/useBrands";
import { INVERTER_KINDS } from "@/pages/shop/inverterKinds";
import logo from "@/assets/kachi-logo.webp";
import { contactInfo, mobileNav } from "../lib/nav";

/**
 * MobileDrawer
 * --------------------------------------------------------------
 * Left side panel on screens below `lg` (Radix Sheet): tapping the dimmed
 * area outside, pressing Escape, the ✕ button or following any link closes it.
 * Page links come from `../lib/nav.ts` (`mobileNav`); car brands from the DB.
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname, search } = useLocation();
  const { data: carBrands = [] } = useCarBrands();

  // Close after any navigation (including back/forward).
  useEffect(() => onClose(), [pathname, search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="flex w-[88%] max-w-sm flex-col gap-0 rounded-r-3xl border-line p-0 lg:hidden">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Shop batteries and browse Kachi Batteries</SheetDescription>

        <div className="flex items-center border-b border-line px-5 py-4">
          <Link to="/" onClick={onClose}><img src={logo} alt="Kachi Batteries" width={317} height={128} className="h-9 w-auto" /></Link>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5">
          {/* Shop */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link to="/shop/car-batteries" onClick={onClose} className="rounded-2xl bg-gradient-hero p-4 text-white">
              <Car className="h-6 w-6 text-volt" />
              <div className="mt-3 font-display text-sm font-bold leading-tight">Car batteries</div>
              <div className="mt-0.5 text-[11px] text-white/60">Find by your car</div>
            </Link>
            <Link to="/shop/inverter-batteries" onClick={onClose} className="rounded-2xl border border-line bg-white p-4">
              <BatteryCharging className="h-6 w-6 text-primary" />
              <div className="mt-3 font-display text-sm font-bold leading-tight text-ink">Inverter & home</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Size your backup</div>
            </Link>
          </div>

          {/* Car brands */}
          {carBrands.length > 0 && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your car</span>
                <Link to="/shop/car-batteries" onClick={onClose} className="text-xs font-semibold text-ink">All {carBrands.length}</Link>
              </div>
              <ul className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
                {carBrands.slice(0, 10).map((b) => (
                  <li key={b.id} className="shrink-0">
                    <Link to={`/shop/car-batteries?car_brand=${b.slug}`} onClick={onClose}
                      className="flex w-[72px] flex-col items-center gap-1 rounded-xl border border-line bg-white px-1 py-2">
                      {b.logo_url ? <img src={b.logo_url} alt="" className="h-6 w-9 object-contain" loading="lazy" /> : <Car className="h-5 w-5 text-ink/50" />}
                      <span className="w-full truncate text-center text-[10px] font-medium text-ink">{b.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inverter types */}
          <div className="mt-5">
            <div className="px-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Home backup</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {INVERTER_KINDS.map((k) => (
                <Link key={k.slug} to={`/shop/inverter-batteries?kind=${k.slug}`} onClick={onClose}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink">
                  {k.label}
                </Link>
              ))}
              <Link to="/shop/inverter-batteries" onClick={onClose} className="inline-flex items-center gap-1 rounded-full bg-volt px-3 py-1.5 text-sm font-semibold text-ink">
                <Calculator className="h-3.5 w-3.5" /> Calculator
              </Link>
            </div>
          </div>

          {/* Pages */}
          <nav aria-label="Pages" className="mt-6 border-t border-line pt-3">
            {mobileNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
                    item.highlight ? "mt-1 bg-primary/10 font-semibold text-primary" : isActive ? "bg-ink text-white" : "text-ink hover:bg-muted"
                  }`
                }
              >
                {item.label}
                <ArrowRight className="h-4 w-4 opacity-40" />
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div className="border-t border-line bg-background p-4">
          <div className="grid grid-cols-2 gap-2">
            <a href={contactInfo.phoneTel} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-white">
              <PhoneCall className="h-4 w-4" /> Call
            </a>
            <a href={contactInfo.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp py-3 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
          <Link to="/quote" onClick={onClose} className="mt-2 flex items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white shadow-red">
            Request call back
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
