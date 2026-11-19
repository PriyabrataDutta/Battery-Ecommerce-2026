import { Link } from "react-router-dom";
import { ArrowRight, BatteryCharging, Calculator, Car, Tag } from "lucide-react";
import { useBatteryBrands, useCarBrands } from "@/hooks/queries/useBrands";
import { INVERTER_KINDS } from "@/pages/shop/inverterKinds";

/**
 * ShopMegaMenu — panel opened from "Shop" in DesktopNav.
 * Car brands and battery brands come from the database (sort_order),
 * inverter types from INVERTER_KINDS, so the menu never needs hand edits.
 */
export function ShopMegaMenu({ onNavigate }: { onNavigate: () => void }) {
  const { data: carBrands = [] } = useCarBrands();
  const { data: batteryBrands = [] } = useBatteryBrands();

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Car batteries */}
      <section className="col-span-5 rounded-2xl bg-background p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white"><Car className="h-5 w-5" /></span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Car batteries</h3>
            <p className="text-xs text-muted-foreground">Pick your car, see what fits</p>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-4 gap-2">
          {carBrands.slice(0, 8).map((b) => (
            <li key={b.id}>
              <Link
                to={`/shop/car-batteries?car_brand=${b.slug}`}
                onClick={onNavigate}
                className="flex h-full flex-col items-center gap-1.5 rounded-xl border border-line bg-white px-1 py-2.5 text-center transition-all hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-card"
              >
                {b.logo_url ? <img src={b.logo_url} alt="" className="h-7 w-10 object-contain" loading="lazy" /> : <Car className="h-6 w-6 text-ink/50" />}
                <span className="line-clamp-1 text-[11px] font-medium text-ink">{b.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/shop/car-batteries" onClick={onNavigate} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary">
          Find by your car · all {carBrands.length || ""} brands <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Inverter & home */}
      <section className="col-span-4 p-1">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-volt"><BatteryCharging className="h-5 w-5" /></span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Inverter & home backup</h3>
            <p className="text-xs text-muted-foreground">Power through every cut</p>
          </div>
        </div>
        <ul className="mt-3 space-y-0.5">
          {INVERTER_KINDS.map((k) => (
            <li key={k.slug}>
              <Link to={`/shop/inverter-batteries?kind=${k.slug}`} onClick={onNavigate} className="group block rounded-xl px-3 py-2 hover:bg-muted/60">
                <span className="flex items-center gap-1 text-sm font-semibold text-ink group-hover:text-primary">
                  {k.label} <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">{k.note}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/shop/inverter-batteries" onClick={onNavigate} className="mt-3 flex items-center gap-3 rounded-xl bg-volt px-3 py-2.5 text-ink hover:brightness-95">
          <Calculator className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Backup calculator</span>
            <span className="block text-xs text-ink/70">Find the right Ah for your home</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </section>

      {/* Brands + clearance */}
      <section className="col-span-3 flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-base font-bold text-ink">Battery brands</h3>
          <Link to="/brands" onClick={onNavigate} className="text-xs font-semibold text-muted-foreground hover:text-ink">View all</Link>
        </div>
        <ul className="grid grid-cols-2 gap-2">
          {batteryBrands.slice(0, 4).map((b) => (
            <li key={b.id}>
              <Link to={`/brand/${b.slug}`} onClick={onNavigate} title={b.name}
                className="grid h-14 place-items-center rounded-xl border border-line bg-white px-2 transition-all hover:border-ink/20 hover:shadow-card">
                {b.logo_url ? <img src={b.logo_url} alt={b.name} className="max-h-8 max-w-full object-contain" loading="lazy" /> : <span className="font-display text-sm font-bold text-ink">{b.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <Link to="/category/clearance" onClick={onNavigate} className="mt-auto flex items-center gap-3 rounded-2xl bg-gradient-red p-4 text-white shadow-red">
          <Tag className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Clearance sale</span>
            <span className="block text-xs text-white/80">Limited stock at lower prices</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
      </section>
    </div>
  );
}
