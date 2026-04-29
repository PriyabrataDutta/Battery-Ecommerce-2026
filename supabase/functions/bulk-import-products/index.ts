// Bulk import products + brands + car fitment from a parsed Excel.
// Caller must be staff. Uses service role internally to bypass RLS for upserts.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InRow {
  battery_name: string;
  battery_brand: string;
  car_brands: string[];
  car_models: string[];
  with_exchange_price: number | null;
  without_exchange_price: number | null;
  warranty_text: string | null;
}

interface InPayload {
  category_slug: string;
  rows: InRow[];
  wipe?: boolean;
}

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractSku(name: string): string {
  const m = name.match(/\b([A-Z0-9]{4,15}[A-Z0-9-]*)\b/);
  return m ? m[1] : slugify(name).slice(0, 20).toUpperCase();
}

function parseWarrantyMonths(txt: string | null): {
  total: number | null;
  split: string | null;
} {
  if (!txt) return { total: null, split: null };
  const total = txt.match(/(\d{2,3})\s*MONTHS/i)?.[1];
  const split = txt.match(/\(([^)]+)\)/)?.[1]?.trim() ?? null;
  return { total: total ? parseInt(total, 10) : null, split };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ??
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      "";

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: staffOk, error: staffErr } = await admin.rpc("is_staff", {
      _user_id: userRes.user.id,
    });
    if (staffErr) return json({ error: staffErr.message }, 500);
    if (!staffOk) return json({ error: "Forbidden — staff only" }, 403);

    const payload = (await req.json()) as InPayload;
    if (!payload?.rows?.length) return json({ error: "rows[] required" }, 400);

    const { data: cat, error: catErr } = await admin
      .from("categories")
      .select("id, slug")
      .eq("slug", payload.category_slug)
      .maybeSingle();
    if (catErr) return json({ error: catErr.message }, 500);
    if (!cat) return json({ error: `Unknown category: ${payload.category_slug}` }, 400);

    if (payload.wipe) {
      await admin.from("products").delete().eq("category_id", cat.id);
    }

    // Battery brands
    const batteryBrandNames = Array.from(
      new Set(payload.rows.map((r) => r.battery_brand).filter(Boolean)),
    );
    if (batteryBrandNames.length) {
      const rows = batteryBrandNames.map((name) => ({ name, slug: slugify(name) }));
      const { error } = await admin.from("battery_brands").upsert(rows, { onConflict: "slug" });
      if (error) return json({ error: `battery_brands: ${error.message}` }, 500);
    }
    const { data: bbAll } = await admin.from("battery_brands").select("id, slug");
    const bbBySlug = new Map((bbAll ?? []).map((b: any) => [b.slug, b.id]));

    // Car brands
    const carBrandSet = new Set<string>();
    payload.rows.forEach((r) => r.car_brands.forEach((b) => b && carBrandSet.add(b.trim())));
    if (carBrandSet.size) {
      const rows = Array.from(carBrandSet).map((name) => ({ name, slug: slugify(name) }));
      const { error } = await admin.from("car_brands").upsert(rows, { onConflict: "slug" });
      if (error) return json({ error: `car_brands: ${error.message}` }, 500);
    }
    const { data: cbAll } = await admin.from("car_brands").select("id, slug");
    const cbBySlug = new Map((cbAll ?? []).map((b: any) => [b.slug, b.id]));

    // Car models
    const modelInputs = new Map<string, { brand_slug: string; name: string }>();
    payload.rows.forEach((r) => {
      const brands = r.car_brands.length ? r.car_brands : ["unknown"];
      r.car_models.forEach((m, i) => {
        const brand = (brands[i] ?? brands[0] ?? "unknown").trim();
        const name = (m || "").trim();
        if (!name) return;
        const key = `${slugify(brand)}__${slugify(name)}`;
        modelInputs.set(key, { brand_slug: slugify(brand), name });
      });
    });

    const modelRowsToUpsert = Array.from(modelInputs.values())
      .map((v) => {
        const brandId = cbBySlug.get(v.brand_slug);
        if (!brandId) return null;
        return {
          car_brand_id: brandId,
          name: v.name,
          slug: `${v.brand_slug}-${slugify(v.name)}`,
        };
      })
      .filter(Boolean) as Array<{ car_brand_id: string; name: string; slug: string }>;

    if (modelRowsToUpsert.length) {
      const { error } = await admin.from("car_models").upsert(modelRowsToUpsert, { onConflict: "slug" });
      if (error) return json({ error: `car_models: ${error.message}` }, 500);
    }
    const { data: cmAll } = await admin.from("car_models").select("id, slug");
    const cmBySlug = new Map((cmAll ?? []).map((m: any) => [m.slug, m.id]));

    // Products
    let upsertedProducts = 0;
    let fitmentLinks = 0;
    const errors: string[] = [];

    for (const r of payload.rows) {
      if (!r.battery_name) continue;
      const sku = extractSku(r.battery_name);
      const slug = slugify(`${r.battery_brand}-${sku}`);
      const price = r.without_exchange_price ?? 0;
      const withEx = r.with_exchange_price;
      const exchange_rebate = price && withEx && price > withEx ? price - withEx : 0;
      const w = parseWarrantyMonths(r.warranty_text);
      const brand_id = bbBySlug.get(slugify(r.battery_brand)) ?? null;

      const productRow = {
        sku,
        slug,
        name: r.battery_name.trim(),
        brand_id,
        category_id: cat.id,
        price,
        mrp: price > 0 ? Math.round(price * 1.05) : null,
        stock: 25,
        warranty_months: w.total,
        capacity_ah: null,
        short_description: `${r.battery_brand} ${sku} — genuine automotive battery.`,
        description: r.battery_name,
        specs: w.split ? { warranty_split: w.split } : {},
        badges: [] as string[],
        is_featured: false,
        is_bestseller: false,
        is_new: false,
        is_on_sale: exchange_rebate > 0,
        status: "active",
        primary_image_url: null,
        has_exchange: exchange_rebate > 0,
        exchange_rebate,
      };

      const { data: prod, error: pErr } = await admin
        .from("products")
        .upsert(productRow, { onConflict: "sku" })
        .select("id")
        .maybeSingle();
      if (pErr || !prod) {
        errors.push(`${sku}: ${pErr?.message ?? "no row"}`);
        continue;
      }
      upsertedProducts++;

      const brands = r.car_brands.length ? r.car_brands : ["unknown"];
      const links = r.car_models
        .map((m, i) => {
          const brand = (brands[i] ?? brands[0] ?? "unknown").trim();
          const modelSlug = `${slugify(brand)}-${slugify((m || "").trim())}`;
          const carModelId = cmBySlug.get(modelSlug);
          return carModelId ? { product_id: prod.id, car_model_id: carModelId } : null;
        })
        .filter(Boolean) as Array<{ product_id: string; car_model_id: string }>;

      if (links.length) {
        await admin.from("product_fitment").delete().eq("product_id", prod.id);
        const { error: fErr } = await admin.from("product_fitment").insert(links);
        if (fErr) errors.push(`${sku} fitment: ${fErr.message}`);
        else fitmentLinks += links.length;
      }
    }

    return json({
      ok: true,
      upserted_products: upsertedProducts,
      fitment_links: fitmentLinks,
      battery_brands: batteryBrandNames.length,
      car_brands: cbBySlug.size,
      car_models: cmBySlug.size,
      errors,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
