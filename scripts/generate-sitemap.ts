// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls dynamic routes (products, categories, brands, blog posts) from the backend
// using the same public filters the storefront pages use.

import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://www.kachibatteries.com";

// Load .env values without extra deps (tsx does not read .env automatically).
function envFromFile(): Record<string, string> {
  const file = resolve(".env");
  if (!existsSync(file)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const fileEnv = envFromFile();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? fileEnv.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/shop/car-batteries", changefreq: "daily", priority: "0.9" },
  { path: "/shop/inverter-batteries", changefreq: "daily", priority: "0.9" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/catalog", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/jump-start", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/quote", changefreq: "monthly", priority: "0.5" },
];

async function fetchRows(table: string, query: string): Promise<Record<string, string>[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) {
      console.warn(`sitemap: ${table} fetch failed (${res.status})`);
      return [];
    }
    return (await res.json()) as Record<string, string>[];
  } catch (err) {
    console.warn(`sitemap: ${table} fetch error`, err);
    return [];
  }
}

async function collectEntries(): Promise<SitemapEntry[]> {
  // Category pages only redirect to /shop/car-batteries or /shop/inverter-batteries,
  // which are listed in staticEntries, so categories are not listed here.
  const [products, brands, posts] = await Promise.all([
    fetchRows("products", "select=slug&status=eq.active"),
    fetchRows("battery_brands", "select=slug"),
    fetchRows("blog_posts", "select=slug&is_published=eq.true"),
  ]);

  return [
    ...staticEntries,
    ...brands.filter((b) => b.slug).map((b) => ({
      path: `/brand/${b.slug}`,
      changefreq: "weekly" as const,
      priority: "0.7",
    })),
    ...products.filter((p) => p.slug).map((p) => ({
      path: `/product/${p.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
    ...posts.filter((p) => p.slug).map((p) => ({
      path: `/blog/${p.slug}`,
      changefreq: "monthly" as const,
      priority: "0.6",
    })),
  ];
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${escapeXml(`${BASE_URL}${e.path}`)}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

const entries = await collectEntries();
writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
console.log(`sitemap.xml written (${entries.length} entries)`);

// ── llms.txt (https://llmstxt.org): a plain-markdown map of the site for AI assistants ──
async function generateLlmsTxt() {
  const [posts, brands] = await Promise.all([
    fetchRows("blog_posts", "select=slug,title,excerpt&is_published=eq.true&order=published_at.desc"),
    fetchRows("battery_brands", "select=slug,name&order=sort_order"),
  ]);
  const url = (p: string) => `${BASE_URL}${p}`;
  const lines = [
    "# Kachi Batteries",
    "",
    "> Online store for genuine car and inverter batteries (Amaron, Exide, Power Zone, Elito) in India, run from Bengaluru by Kachi Batteries, a sister concern of Manjunatha Batteries. Customers can find a battery by car make and model, size an inverter battery with a backup calculator, pay online or cash on delivery, and get free standard delivery.",
    "",
    "## Key facts",
    "",
    "- Products: car batteries, inverter batteries (tubular, SMF/VRLA, lithium), inverters and UPS.",
    `- Brands: ${brands.map((b) => b.name).join(", ")}.`,
    "- Prices on the site exclude GST; GST is added per product in the cart and at checkout.",
    "- Old battery exchange: choose the exchange price and hand over the old battery at delivery or installation.",
    "- Delivery: standard delivery free (3–5 business days); express ₹299 (1–2 business days); doorstep installation with old battery pickup ₹499.",
    "- Payment: online (UPI, cards, net banking via Cashfree) or cash on delivery.",
    "- Returns: unused, uninstalled batteries within 7 days of delivery; transit damage reported within 48 hours.",
    "- Warranty: manufacturer warranty as shown on each product page; claims via the brand's authorised service centres.",
    "- Jump start service: Bengaluru only, during store hours, usually 30–60 minutes; price on call.",
    "- Store: Manjunatha Batteries, Bengaluru, Karnataka. Phone/WhatsApp +91 81975 68707, email kachibatteries@gmail.com.",
    "",
    "## Shop",
    "",
    `- [Car batteries by vehicle](${url("/shop/car-batteries")}): pick car brand and model to see batteries that fit.`,
    `- [Inverter batteries](${url("/shop/inverter-batteries")}): tubular, SMF and lithium, with a backup calculator.`,
    `- [All brands](${url("/brands")})`,
    ...brands.map((b) => `- [${b.name} batteries](${url(`/brand/${b.slug}`)})`),
    `- [Clearance sale](${url("/category/clearance")})`,
    "",
    "## Guides",
    "",
    ...posts.map((p) => `- [${p.title}](${url(`/blog/${p.slug}`)})${p.excerpt ? `: ${p.excerpt}` : ""}`),
    "",
    "## Services and policies",
    "",
    `- [Car jump start service, Bengaluru](${url("/jump-start")})`,
    `- [Bulk / B2B quote](${url("/quote")})`,
    `- [Contact](${url("/contact")})`,
    `- [Return & refund policy](${url("/refund-policy")})`,
    `- [Privacy policy](${url("/privacy-policy")})`,
    "",
    "## Optional",
    "",
    `- [Sitemap](${url("/sitemap.xml")})`,
    `- [About](${url("/about")})`,
    "",
  ];
  writeFileSync(resolve("public/llms.txt"), lines.join("\n"));
  console.log(`llms.txt written (${posts.length} guides)`);
}

await generateLlmsTxt();
