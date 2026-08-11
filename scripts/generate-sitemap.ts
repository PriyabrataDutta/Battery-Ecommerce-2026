// Runs before `vite dev` and `vite build` (predev/prebuild hooks); writes public/sitemap.xml.
// Pulls dynamic routes (products, categories, brands, blog posts) from the backend
// using the same public filters the storefront pages use.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://power-drive-finder.lovable.app";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/brands", changefreq: "weekly", priority: "0.7" },
  { path: "/catalog", changefreq: "monthly", priority: "0.6" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/jump-start", changefreq: "monthly", priority: "0.6" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
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
  const [products, categories, brands, posts] = await Promise.all([
    fetchRows("products", "select=slug&status=eq.active"),
    fetchRows("categories", "select=slug"),
    fetchRows("battery_brands", "select=slug"),
    fetchRows("blog_posts", "select=slug&is_published=eq.true"),
  ]);

  return [
    ...staticEntries,
    ...categories.filter((c) => c.slug).map((c) => ({
      path: `/category/${c.slug}`,
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
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
