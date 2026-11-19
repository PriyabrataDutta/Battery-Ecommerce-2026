import { useSearchParams } from "react-router-dom";
import { INVERTER_KINDS } from "./inverterKinds";

/** Battery type + minimum capacity chips for the inverter shop (URL params kind, min_capacity). */
export function InverterFilters({ capacities }: { capacities: number[] }) {
  const [params, setParams] = useSearchParams();
  const kind = params.get("kind") ?? "";
  const minCap = params.get("min_capacity") ?? "";

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    p.delete("page");
    setParams(p);
  };
  const chip = (on: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${on ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-ink/40"}`;
  const active = INVERTER_KINDS.find((k) => k.slug === kind);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2.5 text-[13px] font-semibold text-ink">Battery type</h3>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" aria-pressed={!kind} onClick={() => set("kind", null)} className={chip(!kind)}>All</button>
          {INVERTER_KINDS.map((k) => (
            <button key={k.slug} type="button" aria-pressed={kind === k.slug} onClick={() => set("kind", kind === k.slug ? null : k.slug)} className={chip(kind === k.slug)}>
              {k.label}
            </button>
          ))}
        </div>
        {active && <p className="mt-2 text-xs text-muted-foreground">{active.note}</p>}
      </div>
      {capacities.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-[13px] font-semibold text-ink">Capacity</h3>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" aria-pressed={!minCap} onClick={() => set("min_capacity", null)} className={chip(!minCap)}>Any</button>
            {capacities.map((c) => (
              <button key={c} type="button" aria-pressed={minCap === String(c)} onClick={() => set("min_capacity", minCap === String(c) ? null : String(c))} className={chip(minCap === String(c))}>
                {c}Ah+
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
