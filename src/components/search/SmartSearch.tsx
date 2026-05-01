import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, BatteryCharging, Car, CarFront, Package, LayoutGrid, Clock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";

const RECENT_KEY = "kachi.recentSearches";
const RECENT_MAX = 6;

type RecentItem = { label: string; path: string; sublabel?: string; kind: string };

function loadRecent(): RecentItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

function saveRecent(items: RecentItem[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_MAX))); } catch {}
}

type Suggestion =
  | { kind: "category"; id: string; label: string; slug: string }
  | { kind: "brand"; id: string; label: string; slug: string }
  | { kind: "car_brand"; id: string; label: string; slug: string }
  | { kind: "car_model"; id: string; label: string; sublabel?: string; slug: string }
  | { kind: "product"; id: string; label: string; slug: string; price: number; image: string | null; brand?: string };

function useDebounced<T>(value: T, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

interface Props {
  placeholder?: string;
  className?: string;
  onNavigate?: () => void;
  autoFocus?: boolean;
}

export function SmartSearch({ placeholder = "Search batteries, brands, models...", className = "", onNavigate, autoFocus }: Props) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [recent, setRecent] = useState<RecentItem[]>(() => loadRecent());
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim(), 200);

  const pushRecent = (item: RecentItem) => {
    setRecent((prev) => {
      const next = [item, ...prev.filter((r) => r.path !== item.path)].slice(0, RECENT_MAX);
      saveRecent(next);
      return next;
    });
  };

  const removeRecent = (path: string) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r.path !== path);
      saveRecent(next);
      return next;
    });
  };

  const clearRecent = () => { setRecent([]); saveRecent([]); };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["smart_search", debounced],
    enabled: debounced.length >= 2,
    queryFn: async () => {
      const like = `%${debounced}%`;
      const [cats, brands, carBrands, models, prods] = await Promise.all([
        supabase.from("categories").select("id,name,slug").ilike("name", like).limit(4),
        supabase.from("battery_brands").select("id,name,slug").ilike("name", like).limit(4),
        supabase.from("car_brands").select("id,name,slug").ilike("name", like).limit(4),
        supabase.from("car_models").select("id,name,slug, car_brands(name,slug)").ilike("name", like).limit(5),
        supabase
          .from("products")
          .select("id,name,slug,sku,price,primary_image_url, battery_brands(name)")
          .eq("status", "active")
          .or(`name.ilike.${like},sku.ilike.${like},short_description.ilike.${like}`)
          .limit(6),
      ]);
      return {
        categories: (cats.data ?? []) as Array<{ id: string; name: string; slug: string }>,
        brands: (brands.data ?? []) as Array<{ id: string; name: string; slug: string }>,
        carBrands: (carBrands.data ?? []) as Array<{ id: string; name: string; slug: string }>,
        models: (models.data ?? []) as Array<{ id: string; name: string; slug: string; car_brands: { name: string; slug: string } | null }>,
        products: (prods.data ?? []) as Array<{
          id: string; name: string; slug: string; sku: string; price: number;
          primary_image_url: string | null; battery_brands: { name: string } | null;
        }>,
      };
    },
  });

  const suggestions: Suggestion[] = [];
  if (data) {
    data.categories.forEach((c) => suggestions.push({ kind: "category", id: c.id, label: c.name, slug: c.slug }));
    data.brands.forEach((b) => suggestions.push({ kind: "brand", id: b.id, label: b.name, slug: b.slug }));
    data.carBrands.forEach((b) => suggestions.push({ kind: "car_brand", id: b.id, label: b.name, slug: b.slug }));
    data.models.forEach((m) =>
      suggestions.push({ kind: "car_model", id: m.id, label: m.name, sublabel: m.car_brands?.name, slug: m.slug })
    );
    data.products.forEach((p) =>
      suggestions.push({
        kind: "product",
        id: p.id,
        label: p.name,
        slug: p.slug,
        price: Number(p.price),
        image: p.primary_image_url,
        brand: p.battery_brands?.name,
      })
    );
  }

  const go = (path: string) => {
    setOpen(false);
    setTerm("");
    onNavigate?.();
    navigate(path);
  };

  const pick = (s: Suggestion) => {
    const sublabel =
      s.kind === "category" ? "Battery Category" :
      s.kind === "brand" ? "Battery Brand" :
      s.kind === "car_brand" ? "Car Brand" :
      s.kind === "car_model" ? `Car Model${("sublabel" in s && s.sublabel) ? ` · ${s.sublabel}` : ""}` :
      "Product";
    let path = "";
    switch (s.kind) {
      case "category": path = `/category/${s.slug}`; break;
      case "brand": path = `/brand/${s.slug}`; break;
      case "car_brand": path = `/shop?type=car-batteries&car_brand=${s.slug}`; break;
      case "car_model": path = `/shop?type=car-batteries&car_model=${s.slug}`; break;
      case "product": path = `/product/${s.slug}`; break;
    }
    pushRecent({ label: s.label, path, sublabel, kind: s.kind });
    return go(path);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      pick(suggestions[activeIdx]);
      return;
    }
    // Smart Enter: jump straight to the best match (brand / car model / category / product) instead of a generic search page.
    const best = suggestions[0];
    if (best) {
      pick(best);
      return;
    }
    if (term.trim()) {
      const path = `/search?q=${encodeURIComponent(term.trim())}`;
      pushRecent({ label: term.trim(), path, sublabel: "Search", kind: "query" });
      go(path);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const hasResults = suggestions.length > 0;
  const showPanel = open && term.trim().length >= 2;
  const showRecents = open && term.trim().length === 0 && recent.length > 0;

  let renderIdx = -1;
  const renderRow = (
    s: Suggestion,
    icon: React.ReactNode,
    iconWrap: string,
    right?: React.ReactNode,
  ) => {
    renderIdx++;
    const idx = renderIdx;
    const active = idx === activeIdx;
    return (
      <button
        key={s.kind + s.id}
        type="button"
        onMouseEnter={() => setActiveIdx(idx)}
        onClick={() => pick(s)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm border-l-2 ${
          active ? "bg-muted border-primary" : "border-transparent hover:bg-muted/60"
        }`}
      >
        <span className={`h-8 w-8 grid place-items-center rounded-md flex-shrink-0 ${iconWrap}`}>{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-ink font-medium">{s.label}</span>
          {"sublabel" in s && s.sublabel ? (
            <span className="block truncate text-[11px] text-muted-foreground">{s.sublabel}</span>
          ) : null}
        </span>
        {right}
      </button>
    );
  };

  const SectionHeader = ({ icon, label, count }: { icon: React.ReactNode; label: string; count: number }) => (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 bg-muted/30 border-b border-line">
      <span className="text-primary">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink">{label}</span>
      <span className="text-[10px] text-muted-foreground">({count})</span>
    </div>
  );

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <form onSubmit={submit} className="relative">
        <Input
          value={term}
          onChange={(e) => { setTerm(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-11 pr-12 border-line focus-visible:ring-primary"
        />
        <button type="submit" className="absolute right-0 top-0 h-11 w-11 grid place-items-center text-ink hover:text-primary" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
      </form>

      {showRecents && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-line shadow-elevated z-50 max-h-[70vh] overflow-auto animate-fade-in">
          <div className="flex items-center justify-between px-4 pt-3 pb-1.5 bg-muted/30 border-b border-line">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink">Recent Searches</span>
            </div>
            <button
              type="button"
              onClick={clearRecent}
              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
            >
              Clear all
            </button>
          </div>
          {recent.map((r) => (
            <div
              key={r.path}
              className="group flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted/60"
            >
              <button
                type="button"
                onClick={() => { pushRecent(r); go(r.path); }}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <span className="h-8 w-8 grid place-items-center rounded-md flex-shrink-0 bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-ink font-medium">{r.label}</span>
                  {r.sublabel && <span className="block truncate text-[11px] text-muted-foreground">{r.sublabel}</span>}
                </span>
              </button>
              <button
                type="button"
                onClick={() => removeRecent(r.path)}
                aria-label={`Remove ${r.label}`}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-primary"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-line shadow-elevated z-50 max-h-[70vh] overflow-auto animate-fade-in">
          {isFetching && !hasResults && (
            <div className="px-4 py-6 text-sm text-muted-foreground">Searching…</div>
          )}
          {!isFetching && !hasResults && (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No suggestions. Press Enter to search for "{term}".
            </div>
          )}

          {data && data.categories.length > 0 && (
            <div>
              <SectionHeader icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Battery Category" count={data.categories.length} />
              {data.categories.map((c) =>
                renderRow(
                  { kind: "category", id: c.id, label: c.name, slug: c.slug },
                  <LayoutGrid className="h-4 w-4 text-primary" />,
                  "bg-primary/10",
                )
              )}
            </div>
          )}
          {data && data.brands.length > 0 && (
            <div>
              <SectionHeader icon={<BatteryCharging className="h-3.5 w-3.5" />} label="Battery Brand" count={data.brands.length} />
              {data.brands.map((b) =>
                renderRow(
                  { kind: "brand", id: b.id, label: b.name, slug: b.slug },
                  <BatteryCharging className="h-4 w-4 text-emerald-600" />,
                  "bg-emerald-500/10",
                )
              )}
            </div>
          )}
          {data && data.carBrands.length > 0 && (
            <div>
              <SectionHeader icon={<CarFront className="h-3.5 w-3.5" />} label="Car Brand" count={data.carBrands.length} />
              {data.carBrands.map((b) =>
                renderRow(
                  { kind: "car_brand", id: b.id, label: b.name, slug: b.slug },
                  <CarFront className="h-4 w-4 text-blue-600" />,
                  "bg-blue-500/10",
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">All {b.name} batteries</span>,
                )
              )}
            </div>
          )}
          {data && data.models.length > 0 && (
            <div>
              <SectionHeader icon={<Car className="h-3.5 w-3.5" />} label="Car Model" count={data.models.length} />
              {data.models.map((m) =>
                renderRow(
                  { kind: "car_model", id: m.id, label: m.name, sublabel: m.car_brands?.name, slug: m.slug },
                  <Car className="h-4 w-4 text-amber-600" />,
                  "bg-amber-500/10",
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">Batteries for {m.name}</span>
                )
              )}
            </div>
          )}
          {data && data.products.length > 0 && (
            <div>
              <SectionHeader icon={<Package className="h-3.5 w-3.5" />} label="Products" count={data.products.length} />
              {data.products.map((p) =>
                renderRow(
                  { kind: "product", id: p.id, label: p.name, slug: p.slug, price: Number(p.price), image: p.primary_image_url, brand: p.battery_brands?.name },
                  p.primary_image_url
                    ? <img src={p.primary_image_url} alt="" className="h-7 w-7 object-contain" />
                    : <Package className="h-4 w-4 text-muted-foreground" />,
                  "bg-muted",
                  <span className="text-xs font-bold text-ink whitespace-nowrap">{formatINR(Number(p.price))}</span>
                )
              )}
            </div>
          )}

          {term.trim() && (
            <button
              type="button"
              onClick={() => go(`/shop?q=${encodeURIComponent(term.trim())}`)}
              className="w-full border-t border-line px-4 py-3 text-sm font-bold text-primary hover:bg-muted text-left"
            >
              See all results for "{term.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
