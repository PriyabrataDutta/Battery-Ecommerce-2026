import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Minus, Plus, Zap, ArrowRight } from "lucide-react";
import { APPLIANCES, estimateBackup, type ApplianceId } from "@/lib/backupCalc";

const HOURS = [2, 3, 4, 6, 8];
const START: Partial<Record<ApplianceId, number>> = { fan: 2, led: 4, tv: 1, wifi: 1 };

/** Inverter battery shop header with a backup calculator that sets the min_capacity filter. */
export function InverterShopHero({ count }: { count: number }) {
  const [params, setParams] = useSearchParams();
  const [qty, setQty] = useState<Partial<Record<ApplianceId, number>>>(START);
  const [hours, setHours] = useState(4);
  const est = useMemo(() => estimateBackup(qty, hours), [qty, hours]);

  const bump = (id: ApplianceId, d: number) => setQty((q) => ({ ...q, [id]: Math.min(20, Math.max(0, (q[id] ?? 0) + d)) }));

  const applyEstimate = () => {
    if (!est.recommendedAh) return;
    const p = new URLSearchParams(params);
    p.set("min_capacity", String(est.recommendedAh));
    p.delete("page");
    setParams(p);
    document.getElementById("shop-results")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative overflow-hidden bg-gradient-hero text-white">
      <div className="absolute inset-0 bg-dots" aria-hidden />
      <div className="container-x relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-white/60">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-1.5">/</span>
            <Link to="/shop" className="hover:text-white">Shop</Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">Inverter batteries</span>
          </nav>
          <span className="eyebrow">Inverter & home backup</span>
          <h1 className="mt-2 font-display-tight text-3xl font-bold sm:text-4xl lg:text-5xl">
            Keep the lights on through every power cut
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            Tell us what you want to run and for how long. We'll suggest the battery size, then show batteries that match.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/85 sm:text-sm">
            {count} product{count !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 text-ink shadow-elevated sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold">Backup calculator</h2>
            <span className="text-xs text-muted-foreground">Estimate only</span>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {APPLIANCES.map((a) => {
              const n = qty[a.id] ?? 0;
              return (
                <li key={a.id} className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 ${n ? "border-ink/20 bg-muted/50" : "border-line"}`}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{a.label}</span>
                    <span className="text-[11px] text-muted-foreground">{a.watts} W</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => bump(a.id, -1)} disabled={!n} aria-label={`Fewer ${a.label}`} className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white disabled:opacity-40"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">{n}</span>
                    <button type="button" onClick={() => bump(a.id, 1)} aria-label={`More ${a.label}`} className="grid h-7 w-7 place-items-center rounded-full border border-line bg-white"><Plus className="h-3.5 w-3.5" /></button>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <div className="text-sm font-medium">Backup needed</div>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Backup hours">
              {HOURS.map((h) => (
                <button key={h} type="button" role="radio" aria-checked={hours === h} onClick={() => setHours(h)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${hours === h ? "bg-ink text-white" : "bg-muted text-ink hover:bg-muted/70"}`}>
                  {h} hrs
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-ink p-4 text-white">
            {est.recommendedAh ? (
              <>
                <div className="text-xs text-white/60">Load {est.watts} W · about {est.requiredAh} Ah needed</div>
                <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-3xl font-extrabold">{est.batteries === 2 ? "2 × " : ""}{est.recommendedAh}Ah</span>
                  <span className="text-sm text-white/70">battery · {est.inverterVA} VA inverter</span>
                </div>
                {est.batteries === 2 && <p className="mt-1 text-xs text-white/60">Two batteries on a 24 V inverter.</p>}
                <button type="button" onClick={applyEstimate} className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold shadow-red hover:bg-primary-hover">
                  <Zap className="h-4 w-4" /> Show {est.recommendedAh}Ah+ batteries <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <p className="text-sm text-white/75">
                {est.watts === 0 ? "Add the appliances you want to run." : "That load needs more than two batteries. Call us and we'll size a system for you."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
