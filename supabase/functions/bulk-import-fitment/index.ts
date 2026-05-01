import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

interface IncomingRow {
  battery_name: string;
  battery_brand: string;
  car_brands: string[];
  car_models: string[];
  with_exchange_price: number | null;
  without_exchange_price: number | null;
  warranty_text: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const db = createClient(supabaseUrl, serviceKey);

    // Check staff
    const { data: roleRows } = await db
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "staff"]);
    if (!roleRows?.length) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const rows: IncomingRow[] = body.rows;
    if (!Array.isArray(rows) || !rows.length) return json({ error: "No rows provided" }, 400);

    // --- 1. Collect unique car brands ---
    const allCarBrandNames = new Set<string>();
    const modelToBrands = new Map<string, Set<string>>();

    for (const row of rows) {
      const brands = row.car_brands.map((b) => titleCase(b.trim())).filter(Boolean);
      const models = row.car_models.map((m) => m.trim()).filter(Boolean);

      brands.forEach((b) => allCarBrandNames.add(b));

      for (const m of models) {
        const mUp = m.toUpperCase();
        let matched = false;
        for (const b of brands) {
          if (mUp.startsWith(b.toUpperCase())) {
            if (!modelToBrands.has(m)) modelToBrands.set(m, new Set());
            modelToBrands.get(m)!.add(b);
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Single brand or fallback to first
          const fallback = brands.length === 1 ? brands[0] : brands[0];
          if (fallback) {
            if (!modelToBrands.has(m)) modelToBrands.set(m, new Set());
            modelToBrands.get(m)!.add(fallback);
          }
        }
      }
    }

    // --- 2. Upsert car brands ---
    const { data: existingBrands } = await db.from("car_brands").select("id, name");
    const brandMap = new Map<string, string>();
    for (const b of existingBrands ?? []) brandMap.set(b.name.toLowerCase(), b.id);

    let brandsCreated = 0;
    for (const name of allCarBrandNames) {
      if (brandMap.has(name.toLowerCase())) continue;
      const { data: ins, error } = await db
        .from("car_brands")
        .insert({ name, slug: slugify(name) })
        .select("id")
        .single();
      if (ins) {
        brandMap.set(name.toLowerCase(), ins.id);
        brandsCreated++;
      } else if (error) {
        const { data: ex } = await db.from("car_brands").select("id").ilike("name", name).maybeSingle();
        if (ex) brandMap.set(name.toLowerCase(), ex.id);
      }
    }

    // --- 3. Upsert car models ---
    const { data: existingModels } = await db.from("car_models").select("id, name, car_brand_id");
    const modelMap = new Map<string, string>();
    for (const m of existingModels ?? []) modelMap.set(`${m.car_brand_id}|${m.name.toLowerCase()}`, m.id);

    let modelsCreated = 0;
    for (const [modelName, brandNames] of modelToBrands.entries()) {
      for (const brandName of brandNames) {
        const brandId = brandMap.get(brandName.toLowerCase());
        if (!brandId) continue;
        const key = `${brandId}|${modelName.toLowerCase()}`;
        if (modelMap.has(key)) continue;

        const { data: ins, error } = await db
          .from("car_models")
          .insert({ name: modelName, slug: slugify(modelName), car_brand_id: brandId })
          .select("id")
          .single();
        if (ins) {
          modelMap.set(key, ins.id);
          modelsCreated++;
        } else if (error) {
          const { data: ex } = await db
            .from("car_models")
            .select("id")
            .eq("car_brand_id", brandId)
            .ilike("name", modelName)
            .maybeSingle();
          if (ex) modelMap.set(key, ex.id);
        }
      }
    }

    // --- 4. Upsert battery brands ---
    const { data: existingBB } = await db.from("battery_brands").select("id, name");
    const bbMap = new Map<string, string>();
    for (const b of existingBB ?? []) bbMap.set(b.name.toLowerCase(), b.id);

    for (const name of new Set(rows.map((r) => r.battery_brand).filter(Boolean))) {
      if (bbMap.has(name.toLowerCase())) continue;
      const { data: ins } = await db
        .from("battery_brands")
        .insert({ name, slug: slugify(name) })
        .select("id")
        .single();
      if (ins) bbMap.set(name.toLowerCase(), ins.id);
    }

    // --- 5. Upsert products & fitment ---
    const { data: existingProducts } = await db.from("products").select("id, name");
    const productMap = new Map<string, string>();
    for (const p of existingProducts ?? []) productMap.set(p.name.toLowerCase(), p.id);

    const { data: existingFit } = await db.from("product_fitment").select("product_id, car_model_id");
    const fitSet = new Set((existingFit ?? []).map((f) => `${f.product_id}|${f.car_model_id}`));

    let productsCreated = 0;
    let productsUpdated = 0;
    let fitmentsCreated = 0;

    for (const row of rows) {
      let productId = productMap.get(row.battery_name.toLowerCase());
      const bbId = bbMap.get(row.battery_brand.toLowerCase()) ?? null;

      if (!productId) {
        const sku = slugify(row.battery_name).toUpperCase().replace(/-/g, "").slice(0, 30);
        const { data: created } = await db
          .from("products")
          .insert({
            name: row.battery_name,
            slug: slugify(row.battery_name),
            sku,
            brand_id: bbId,
            price: row.without_exchange_price ?? 0,
            price_with_exchange: row.with_exchange_price ?? 0,
            price_without_exchange: row.without_exchange_price ?? 0,
            mrp: row.without_exchange_price,
            status: "active",
            has_exchange: true,
          })
          .select("id")
          .single();
        if (!created) continue;
        productId = created.id;
        productMap.set(row.battery_name.toLowerCase(), productId);
        productsCreated++;
      } else {
        const patch: Record<string, unknown> = {};
        if (row.with_exchange_price != null) patch.price_with_exchange = row.with_exchange_price;
        if (row.without_exchange_price != null) {
          patch.price_without_exchange = row.without_exchange_price;
          patch.price = row.without_exchange_price;
        }
        if (Object.keys(patch).length) {
          await db.from("products").update(patch).eq("id", productId);
          productsUpdated++;
        }
      }

      // Create fitments
      for (const modelName of row.car_models.map((m) => m.trim()).filter(Boolean)) {
        let modelId: string | null = null;
        for (const [key, id] of modelMap.entries()) {
          if (key.endsWith(`|${modelName.toLowerCase()}`)) {
            modelId = id;
            break;
          }
        }
        if (!modelId) continue;
        const fk = `${productId}|${modelId}`;
        if (fitSet.has(fk)) continue;
        const { error } = await db.from("product_fitment").insert({ product_id: productId, car_model_id: modelId });
        if (!error) {
          fitSet.add(fk);
          fitmentsCreated++;
        }
      }
    }

    const summary = {
      brands_created: brandsCreated,
      models_created: modelsCreated,
      products_created: productsCreated,
      products_updated: productsUpdated,
      fitments_created: fitmentsCreated,
      total_rows_processed: rows.length,
    };

    await db.from("activity_log").insert({
      actor_id: userId,
      actor_email: userData.user.email,
      action: "bulk_import.fitment",
      entity_type: "import",
      diff: summary,
    });

    return json(summary);
  } catch (err) {
    console.error("bulk-import-fitment error:", err);
    return json({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
