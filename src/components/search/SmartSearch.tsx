import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Tag, Battery, Car, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";

type Suggestion =
  | { kind: "category"; id: string; label: string; slug: string }
  | { kind: "brand"; id: string; label: string; slug: string }
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebounced(term.trim(), 200);

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
      const [cats, brands, models, prods] = await Promise.all([
        supabase.from("categories").select("id,name,slug").ilike("name", like).limit(4),
        supabase.from("battery_brands").select("id,name,slug").ilike("name", like).limit(4),
        supabase.from("car_models").select("id,name,slug, car_brands(name)").ilike("name", like).limit(5),
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
        models: (models.data ?? []) as Array<{ id: string; name: string; slug: string; car_brands: { name: string } | null }>,
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
    switch (s.kind) {
      case "category": return go(`/category/${s.slug}`);
      case "brand": return go(`/brand/${s.slug}`);
      case "car_model": return go(`/shop?type=car-batteries&car_model=${s.slug}`);
      case "product": return go(`/product/${s.slug}`);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      pick(suggestions[activeIdx]);
    } else if (term.trim()) {
      go(`/shop?q=${encodeURIComponent(term.trim())}`);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  const hasResults = suggestions.length > 0;
  const showPanel = open && term.trim().length >= 2;

  let renderIdx = -1;
  const renderRow = (s: Suggestion, icon: React.ReactNode, right?: React.ReactNode) => {
    renderIdx++;
    const idx = renderIdx;
    const active = idx === activeIdx;
    return (
      <button
        key={s.kind + s.id}
        type="button"
        onMouseEnter={() => setActiveIdx(idx)}
        onClick={() => pick(s)}
        className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm ${active ? "bg-muted" : "hover:bg-muted/60"}`}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1 truncate text-ink">{s.label}{("sublabel" in s && s.sublabel) ? <span className="text-muted-foreground"> · {s.sublabel}</span> : null}</span>
        {right}
      </button>
    );
  };

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
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categories</div>
              {data.categories.map((c) => renderRow({ kind: "category", id: c.id, label: c.name, slug: c.slug }, <Tag className="h-4 w-4" />))}
            </div>
          )}
          {data && data.brands.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Battery Brands</div>
              {data.brands.map((b) => renderRow({ kind: "brand", id: b.id, label: b.name, slug: b.slug }, <Battery className="h-4 w-4" />))}
            </div>
          )}
          {data && data.models.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Car Models</div>
              {data.models.map((m) =>
                renderRow(
                  { kind: "car_model", id: m.id, label: m.name, sublabel: m.car_brands?.name, slug: m.slug },
                  <Car className="h-4 w-4" />,
                  <span className="text-[11px] text-muted-foreground">Batteries for {m.name}</span>
                )
              )}
            </div>
          )}
          {data && data.products.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Products</div>
              {data.products.map((p) =>
                renderRow(
                  { kind: "product", id: p.id, label: p.name, slug: p.slug, price: Number(p.price), image: p.primary_image_url, brand: p.battery_brands?.name },
                  p.primary_image_url
                    ? <img src={p.primary_image_url} alt="" className="h-8 w-8 object-contain bg-muted" />
                    : <Package className="h-4 w-4" />,
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
