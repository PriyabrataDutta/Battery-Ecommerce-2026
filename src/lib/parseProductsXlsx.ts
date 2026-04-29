import * as XLSX from "xlsx";

export interface CleanRow {
  battery_name: string;
  battery_brand: string;
  car_brands: string[];
  car_models: string[];
  with_exchange_price: number | null;
  without_exchange_price: number | null;
  warranty_text: string | null;
}

export interface ParseResult {
  rows: CleanRow[];
  battery_brand_count: number;
  car_brand_count: number;
  car_model_count: number;
  preview: CleanRow[];
}

const HEADERS = {
  battery_name: ["battery name", "name"],
  battery_brand: ["battery brand", "brand"],
  car_brand: ["car brand"],
  car_model: ["car model", "model"],
  with: ["with exchange price"],
  without: ["without exchange price"],
  warranty: ["warranty"],
};

function findKey(row: Record<string, unknown>, candidates: string[]): string | null {
  const keys = Object.keys(row);
  for (const k of keys) {
    const norm = k.toLowerCase().trim();
    for (const c of candidates) if (norm === c || norm.startsWith(c)) return k;
  }
  return null;
}

function splitList(v: unknown): string[] {
  if (v == null) return [];
  return String(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function parseProductsXlsx(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  if (!raw.length) return { rows: [], battery_brand_count: 0, car_brand_count: 0, car_model_count: 0, preview: [] };

  const sample = raw[0];
  const k = {
    name: findKey(sample, HEADERS.battery_name),
    brand: findKey(sample, HEADERS.battery_brand),
    cb: findKey(sample, HEADERS.car_brand),
    cm: findKey(sample, HEADERS.car_model),
    with: findKey(sample, HEADERS.with),
    without: findKey(sample, HEADERS.without),
    war: findKey(sample, HEADERS.warranty),
  };

  const out: CleanRow[] = [];
  let last: CleanRow | null = null;

  for (const r of raw) {
    const name = k.name ? String(r[k.name] ?? "").trim() : "";
    const cb = k.cb ? splitList(r[k.cb]) : [];
    const cm = k.cm ? splitList(r[k.cm]) : [];

    if (!name && last) {
      // Continuation row — append additional fitment to previous
      last.car_brands.push(...cb);
      last.car_models.push(...cm);
      continue;
    }
    if (!name) continue;

    const row: CleanRow = {
      battery_name: name,
      battery_brand: k.brand ? String(r[k.brand] ?? "").trim() : "",
      car_brands: cb,
      car_models: cm,
      with_exchange_price: k.with ? num(r[k.with]) : null,
      without_exchange_price: k.without ? num(r[k.without]) : null,
      warranty_text: k.war ? (r[k.war] ? String(r[k.war]).trim() : null) : null,
    };
    out.push(row);
    last = row;
  }

  const bb = new Set(out.map((r) => r.battery_brand).filter(Boolean));
  const cbAll = new Set<string>();
  const cmAll = new Set<string>();
  out.forEach((r) => {
    r.car_brands.forEach((b) => cbAll.add(b));
    r.car_models.forEach((m) => cmAll.add(m));
  });

  return {
    rows: out,
    battery_brand_count: bb.size,
    car_brand_count: cbAll.size,
    car_model_count: cmAll.size,
    preview: out.slice(0, 5),
  };
}
