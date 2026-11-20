/**
 * Vercel Routing Middleware — server-side SEO for the client-rendered SPA.
 *
 * For public pages it serves index.html with that page's title, description,
 * canonical, Open Graph tags, JSON-LD and a visually hidden text summary inside
 * #root, so crawlers that don't run JavaScript (Bing previews, WhatsApp,
 * ChatGPT/Perplexity fetchers) see real content. React replaces #root on load,
 * and src/main.tsx removes the [data-seo] head tags so Helmet takes over.
 * Unknown URLs get a real 404. App-only routes pass through untouched.
 * Any error falls back to the normal SPA response.
 */
import { next } from "@vercel/functions";
import { marked } from "marked";

export const config = {
  // Extensionless paths only (skips /assets, files like robots.txt, sitemap.xml, images).
  matcher: ["/((?!assets/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};

const SITE = "https://www.kachibatteries.com";
const BRAND = "Kachi Batteries";
const OG = `${SITE}/og-default.jpg`;
const ORG_ID = `${SITE}/#org`;

// Routes rendered only by the app (private, transactional or redirects): no SEO work.
const PASS = [/^\/(cart|checkout|account|auth|reset-password|verify-phone|add-phone|order-confirmation|search|admin)(\/|$)/, /^\/category\//, /^\/account\//];

// Static copy of the home hero, sent inside #root for "/" so the first paint
// (and LCP) happens before the JS bundle runs. React replaces it on mount.
// Regenerate from the rendered page if the hero in src/pages/Home.tsx changes.
// (Kept in this file: the middleware runs unbundled, so local imports fail.)
const HOME_SHELL = `<style>[data-shell] .sh{height:101px}@media(min-width:1024px){[data-shell] .sh{height:158px}}</style>`
  + `<div data-shell><div class="sh border-b border-line/70 bg-white"></div>`
  + '<section class="relative overflow-hidden bg-gradient-hero text-white"><div class="absolute inset-0 bg-dots opacity-60" aria-hidden="true"></div><img src="/hero-car.webp" alt="" fetchpriority="high" decoding="async" class="absolute inset-0 h-full w-full object-cover opacity-[0.18] mix-blend-luminosity" width="1920" height="1080"><div class="container-x relative grid items-center gap-10 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pb-24 lg:pt-20"><div><div class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur"><span class="h-1.5 w-1.5 rounded-full bg-volt" aria-hidden="true"></span> Bengaluru battery store · delivering across India</div><div class="mt-5 font-display-tight text-[2.6rem] font-extrabold sm:text-6xl lg:text-7xl"><span class="block">Power that</span><span class="block">starts <span class="bg-gradient-to-r from-primary to-[hsl(14_95%_58%)] bg-clip-text text-transparent">every time.</span></span></div><p class="mt-5 max-w-lg text-base text-white/70 sm:text-lg">Genuine car and inverter batteries from Amaron, Exide, Power Zone and more. Free standard delivery, doorstep installation and old battery exchange.</p><div class="mt-8 flex flex-col gap-3 sm:flex-row"><a class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 bg-primary text-primary-foreground shadow-red hover:bg-primary-hover h-12 rounded-full px-7 text-[15px]" href="/shop">Shop batteries <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right h-4 w-4"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></a><a class="inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ring-offset-background transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&amp;_svg]:pointer-events-none [&amp;_svg]:size-4 [&amp;_svg]:shrink-0 border h-12 rounded-full px-7 text-[15px] border-white/25 bg-white/5 text-white backdrop-blur hover:bg-white hover:text-ink" href="/quote">Request a call back</a></div><dl class="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6"><div><dt class="font-display text-lg font-bold sm:text-xl">Genuine</dt><dd class="text-xs text-white/55 sm:text-sm">Top brands only</dd></div><div><dt class="font-display text-lg font-bold sm:text-xl">Free</dt><dd class="text-xs text-white/55 sm:text-sm">Standard delivery</dd></div><div><dt class="font-display text-lg font-bold sm:text-xl">Doorstep</dt><dd class="text-xs text-white/55 sm:text-sm">Installation</dd></div></dl></div></div></section>\n'
  + `</div>`;

type Page = { status?: number; title: string; description: string; path: string; image?: string; type?: string; noindex?: boolean; jsonLd?: object[]; body: string; shell?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fullTitle = (t: string) => (t.includes(BRAND) ? t : `${t} | ${BRAND}`);
const clip = (s: string) => (s.length > 160 ? `${s.slice(0, 157).trimEnd()}…` : s);
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const crumbs = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...items].map((b, i) => ({ "@type": "ListItem", position: i + 1, name: b.name, item: `${SITE}${b.path}` })),
});
const link = (path: string, text: string) => `<a href="${path}">${esc(text)}</a>`;

// Markdown → HTML with raw HTML in the source escaped (staff-authored content; no scripts).
marked.use({ renderer: { html: ({ text }) => esc(text) } });

const STATIC: Record<string, Omit<Page, "path">> = {
  "/": {
    title: "Buy Car & Inverter Batteries Online in India",
    description: "Genuine Amaron, Exide, Power Zone and Elito car and inverter batteries. Find the battery that fits your car, free standard delivery, doorstep installation and old battery exchange.",
    body: `<h1>Car and inverter batteries, delivered</h1><p>Kachi Batteries sells genuine Amaron, Exide, Power Zone and Elito batteries from Bengaluru, a sister concern of Manjunatha Batteries. Standard delivery is free (3–5 business days), express delivery is ₹299, and doorstep installation with old battery pickup is ₹499. Pay online or cash on delivery.</p><ul><li>${link("/shop/car-batteries", "Car batteries by vehicle")}</li><li>${link("/shop/inverter-batteries", "Inverter batteries and backup calculator")}</li><li>${link("/brands", "Battery brands")}</li><li>${link("/jump-start", "Jump start service in Bengaluru")}</li><li>${link("/blog", "Battery guides")}</li></ul>`,
  },
  "/shop": { title: "Shop Batteries: Car & Inverter", description: "Shop genuine car batteries by vehicle or inverter and home backup batteries by capacity. Free standard delivery and old battery exchange.", body: `<h1>Shop batteries</h1><ul><li>${link("/shop/car-batteries", "Car batteries")}</li><li>${link("/shop/inverter-batteries", "Inverter and home backup batteries")}</li></ul>` },
  "/shop/inverter-batteries": { title: "Inverter Batteries — Tubular, SMF & Lithium", description: "Tubular, SMF and lithium inverter batteries for home backup. Use our backup calculator to pick the right Ah, with free standard delivery and old battery exchange.", body: `<h1>Inverter batteries</h1><p>Tubular, SMF/VRLA and lithium batteries for home inverters. Battery size (Ah) ≈ total watts × backup hours ÷ 9 for a 12V battery; read ${link("/blog/inverter-battery-capacity-guide", "how to size an inverter battery")} and ${link("/blog/tubular-vs-smf", "tubular vs SMF")}.</p>` },
  "/brands": { title: "Battery Brands — Amaron, Exide, Power Zone, Elito", description: "Shop genuine batteries from India's most trusted brands: Amaron, Exide, Power Zone and Elito. Manufacturer warranty, free standard delivery.", body: `<h1>Battery brands</h1><ul><li>${link("/brand/amaron", "Amaron")}</li><li>${link("/brand/exide", "Exide")}</li><li>${link("/brand/power-zone", "Power Zone")}</li><li>${link("/brand/elito", "Elito")}</li></ul>` },
  "/jump-start": { title: "Car Jump Start Service in Bengaluru", description: "Dead car battery in Bengaluru? Our technician reaches you in about 30–60 minutes during store hours for a safe jump start. Call or WhatsApp Kachi Batteries.", body: `<h1>Car jump start service in Bengaluru</h1><p>Available in Bengaluru only, during store hours. A technician usually reaches you within 30–60 minutes. Call or WhatsApp +91 81975 68707 with your location; we confirm the charge before setting out. See also ${link("/blog/jump-start-guide", "how to jump start a car safely")}.</p>` },
  "/contact": { title: "Contact Us — Call, WhatsApp or Visit", description: "Contact Kachi Batteries: call or WhatsApp +91 81975 68707, email kachibatteries@gmail.com, or visit our store, Manjunatha Batteries in Bengaluru.", body: `<h1>Contact Kachi Batteries</h1><p>Phone and WhatsApp: +91 81975 68707. Email: kachibatteries@gmail.com. Store: Manjunatha Batteries, Bengaluru, Karnataka.</p>` },
  "/about": { title: "About Us — Genuine Batteries from Bengaluru", description: "Kachi Batteries, a sister concern of Manjunatha Batteries in Bengaluru, sells genuine car, inverter and UPS batteries with free standard delivery and doorstep installation.", body: `<h1>About Kachi Batteries</h1><p>Kachi Batteries is the online store of Manjunatha Batteries, Bengaluru. We sell genuine car and inverter batteries with manufacturer warranty, free standard delivery and optional doorstep installation.</p>` },
  "/quote": { title: "Bulk & B2B Battery Quote", description: "Request a bulk or B2B quote for car, inverter and UPS batteries. Dealer pricing, BOQ support and a dedicated account manager from Kachi Batteries.", body: `<h1>Bulk and B2B battery quote</h1>` },
  "/catalog": { title: "Battery Catalogs & Price Lists", description: "Download battery catalogs, price lists and product datasheets from Kachi Batteries.", body: `<h1>Catalogs and price lists</h1>` },
  "/privacy-policy": { title: "Privacy Policy", description: "How Kachi Batteries collects, uses and protects your personal data, in line with India's DPDP Act 2023.", body: `<h1>Privacy policy</h1>` },
  "/refund-policy": { title: "Return & Refund Policy", description: "Kachi Batteries returns, cancellations, old battery exchange, warranty claims and refund timelines.", body: `<h1>Return and refund policy</h1><p>Unused, uninstalled batteries can be returned within 7 days of delivery; report transit damage within 48 hours.</p>` },
};

async function db<T>(path: string): Promise<T | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  return res.ok ? ((await res.json()) as T) : null;
}

type Product = {
  slug: string; name: string; sku: string; description: string | null; short_description: string | null; meta_title: string | null; meta_description: string | null;
  primary_image_url: string | null; price: number; price_with_exchange: number; price_without_exchange: number; mrp: number | null; stock: number;
  capacity_ah: number | null; warranty_months: number | null; has_exchange: boolean;
  gst_rates: { rate: number } | null; battery_brands: { name: string; slug: string } | null; categories: { slug: string; name: string } | null;
};

async function productPage(slug: string): Promise<Page | null> {
  const rows = await db<Product[]>(`products?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=slug,name,sku,description,short_description,meta_title,meta_description,primary_image_url,price,price_with_exchange,price_without_exchange,mrp,stock,capacity_ah,warranty_months,has_exchange,gst_rates(rate),battery_brands(name,slug),categories(slug,name)&limit=1`);
  const p = rows?.[0];
  if (!p) return null;
  const rate = p.gst_rates?.rate ?? 18;
  const gst = (n: number) => Math.round(n * (1 + rate / 100) * 100) / 100;
  const without = gst(Number(p.price_without_exchange || p.price));
  const withEx = gst(Number(p.price_with_exchange || p.price));
  const brand = p.battery_brands?.name ?? "";
  const isCar = p.categories?.slug === "car-batteries";
  const path = `/product/${p.slug}`;
  const cap = p.capacity_ah && !p.name.includes(`${p.capacity_ah}`) ? ` ${p.capacity_ah}Ah` : "";
  const facts = [p.capacity_ah && `${p.capacity_ah}Ah capacity`, p.warranty_months && `${p.warranty_months}-month manufacturer warranty`].filter(Boolean).join(", ");
  const description = p.meta_description || `Buy ${p.name}${facts ? ` (${facts})` : ""} at ${inr(without)} incl. GST, or ${inr(withEx)} with old battery exchange. Free standard delivery, doorstep installation available.`;
  const priceValidUntil = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const availability = p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const offer = (name: string, price: number) => ({
    "@type": "Offer", name, price, priceCurrency: "INR", priceValidUntil, availability, itemCondition: "https://schema.org/NewCondition", url: `${SITE}${path}`, seller: { "@id": ORG_ID },
  });
  const crumb = isCar ? { name: "Car batteries", path: "/shop/car-batteries" } : { name: "Inverter batteries", path: "/shop/inverter-batteries" };
  return {
    title: p.meta_title || `${p.name}${cap} — Price & Warranty`,
    description, path, image: p.primary_image_url ?? undefined, type: "product",
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, mpn: p.sku, description: p.description || p.short_description || description,
        ...(p.primary_image_url ? { image: [p.primary_image_url] } : {}),
        brand: { "@type": "Brand", name: brand || BRAND },
        ...(p.categories?.name ? { category: p.categories.name } : {}),
        offers: [offer("Without exchange", without), ...(p.has_exchange && withEx < without ? [offer("With old battery exchange", withEx)] : [])],
      },
      crumbs([crumb, { name: p.name, path }]),
    ],
    body: `<h1>${esc(p.name)}</h1><p>${esc(brand)} ${esc(p.categories?.name ?? "battery")}. ${esc(facts)}. Price ${inr(without)} including GST${p.has_exchange && withEx < without ? `, or ${inr(withEx)} with old battery exchange` : ""}. ${p.stock > 0 ? "In stock." : "Currently out of stock."}</p>${p.description ? `<p>${esc(p.description)}</p>` : ""}<p>${link(crumb.path, `More ${crumb.name.toLowerCase()}`)}${p.battery_brands ? ` · ${link(`/brand/${p.battery_brands.slug}`, `${brand} batteries`)}` : ""}</p>`,
  };
}

async function brandPage(slug: string): Promise<Page | null> {
  const rows = await db<{ id: string; name: string; slug: string; description: string | null; logo_url: string | null }[]>(`battery_brands?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,description,logo_url&limit=1`);
  const b = rows?.[0];
  if (!b) return null;
  const items = (await db<{ slug: string; name: string }[]>(`products?brand_id=eq.${b.id}&status=eq.active&select=slug,name&order=name&limit=60`)) ?? [];
  const path = `/brand/${b.slug}`;
  return {
    title: `${b.name} Batteries — Car & Inverter, Price List`,
    description: `Buy genuine ${b.name} car and inverter batteries online. ${items.length} models with manufacturer warranty, free standard delivery and old battery exchange.`,
    path, image: b.logo_url ?? undefined,
    jsonLd: [{ "@context": "https://schema.org", "@type": "Brand", name: b.name, url: `${SITE}${path}`, ...(b.logo_url ? { logo: b.logo_url } : {}) }, crumbs([{ name: "Brands", path: "/brands" }, { name: b.name, path }])],
    body: `<h1>${esc(b.name)} batteries</h1>${b.description ? `<p>${esc(b.description)}</p>` : ""}<ul>${items.map((i) => `<li>${link(`/product/${i.slug}`, i.name)}</li>`).join("")}</ul>`,
  };
}

type Post = { slug: string; title: string; excerpt: string | null; body: string | null; cover_url: string | null; published_at: string | null; updated_at: string | null; created_at: string };

async function blogPost(slug: string): Promise<Page | null> {
  const rows = await db<Post[]>(`blog_posts?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=slug,title,excerpt,body,cover_url,published_at,updated_at,created_at&limit=1`);
  const p = rows?.[0];
  if (!p) return null;
  const path = `/blog/${p.slug}`;
  const md = (p.body ?? "").replace(/\\n/g, "\n");
  return {
    title: p.title, description: p.excerpt ?? p.title, path, image: p.cover_url ?? undefined, type: "article",
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "Article", headline: p.title, ...(p.excerpt ? { description: p.excerpt } : {}),
        image: [p.cover_url ?? OG], datePublished: p.published_at ?? p.created_at, dateModified: p.updated_at ?? p.published_at ?? p.created_at,
        inLanguage: "en-IN", mainEntityOfPage: `${SITE}${path}`, author: { "@id": ORG_ID }, publisher: { "@id": ORG_ID },
      },
      crumbs([{ name: "Blog", path: "/blog" }, { name: p.title, path }]),
    ],
    body: `<article><h1>${esc(p.title)}</h1>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ""}${marked.parse(md, { async: false }) as string}</article>`,
  };
}

async function blogIndex(): Promise<Page> {
  const posts = (await db<Post[]>("blog_posts?is_published=eq.true&select=slug,title,excerpt&order=published_at.desc")) ?? [];
  return {
    title: "The Battery Journal — Battery Guides & Tips", path: "/blog",
    description: "Plain-English guides on choosing, caring for and replacing car and inverter batteries, from Kachi Batteries.",
    jsonLd: [crumbs([{ name: "Blog", path: "/blog" }])],
    body: `<h1>Battery guides and tips</h1><ul>${posts.map((p) => `<li>${link(`/blog/${p.slug}`, p.title)}${p.excerpt ? ` — ${esc(p.excerpt)}` : ""}</li>`).join("")}</ul>`,
  };
}

async function carShop(url: URL): Promise<Page> {
  const brandSlug = url.searchParams.get("car_brand")?.toLowerCase();
  let name = "";
  if (brandSlug) {
    const rows = await db<{ name: string }[]>(`car_brands?slug=eq.${encodeURIComponent(brandSlug)}&select=name&limit=1`);
    name = rows?.[0]?.name ?? "";
  }
  return {
    title: name ? `${name} Battery — Price & Fitment` : "Car Batteries Online — Find by Your Car",
    description: `${name ? `Batteries that fit your ${name}. ` : "Pick your car brand and model and see only batteries that fit. "}Genuine Amaron, Exide and Power Zone with warranty, free standard delivery and doorstep installation.`,
    path: name ? `/shop/car-batteries?car_brand=${brandSlug}` : "/shop/car-batteries",
    jsonLd: [crumbs([{ name: "Shop", path: "/shop" }, { name: "Car batteries", path: "/shop/car-batteries" }])],
    body: `<h1>${name ? `Batteries for ${esc(name)} cars` : "Car batteries"}</h1><p>Choose your car brand and model to see batteries listed as fitting it. Read ${link("/blog/how-to-choose-car-battery", "how to choose the right car battery")}.</p>`,
  };
}

async function pageFor(url: URL): Promise<Page | null> {
  const path = url.pathname.replace(/\/+$/, "") || "/";
  if (STATIC[path]) {
    const s = STATIC[path];
    return { ...s, path, shell: path === "/" ? HOME_SHELL : undefined, jsonLd: s.jsonLd ?? (path === "/" ? [] : [crumbs([{ name: s.title.split(" — ")[0], path }])]) };
  }
  if (path === "/shop/car-batteries") return carShop(url);
  if (path === "/blog") return blogIndex();
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/product\/([^/]+)$/))) return productPage(decodeURIComponent(m[1]));
  if ((m = path.match(/^\/brand\/([^/]+)$/))) return brandPage(decodeURIComponent(m[1]));
  if ((m = path.match(/^\/blog\/([^/]+)$/))) return blogPost(decodeURIComponent(m[1]));
  return null;
}

function render(shell: string, page: Page): string {
  const url = `${SITE}${page.path}`;
  const title = esc(fullTitle(page.title));
  const desc = esc(clip(page.description));
  const img = esc(page.image || OG);
  const robots = page.noindex ? `<meta data-seo name="robots" content="noindex, follow">` : `<link data-seo rel="canonical" href="${esc(url)}">`;
  const head = [
    `<title>${title}</title>`,
    `<meta data-seo name="description" content="${desc}">`,
    robots,
    `<meta data-seo property="og:type" content="${page.type ?? "website"}">`,
    `<meta data-seo property="og:url" content="${esc(url)}">`,
    `<meta data-seo property="og:title" content="${title}">`,
    `<meta data-seo property="og:description" content="${desc}">`,
    `<meta data-seo property="og:image" content="${img}">`,
    `<meta data-seo name="twitter:title" content="${title}">`,
    `<meta data-seo name="twitter:description" content="${desc}">`,
    `<meta data-seo name="twitter:image" content="${img}">`,
    ...(page.jsonLd ?? []).map((j) => `<script data-seo type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");
  return shell
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, `<!--seo:start-->\n    ${head}\n    <!--seo:end-->`)
    .replace('<div id="root"></div>', `<div id="root"><div class="sr-only" data-seo-body>${page.body}</div>${page.shell ?? ""}</div>`);
}

export default async function middleware(request: Request) {
  try {
    if (request.method !== "GET") return next();
    const url = new URL(request.url);
    if (PASS.some((r) => r.test(url.pathname))) return next();

    // Forward preview-protection credentials (no effect in production).
    const fwd = new Headers();
    for (const h of ["cookie", "authorization", "x-vercel-protection-bypass"]) {
      const v = request.headers.get(h);
      if (v) fwd.set(h, v);
    }
    const shellRes = await fetch(new URL("/index.html", url), { headers: fwd });
    if (!shellRes.ok) return next({ headers: { "x-seo-mw": `shell-${shellRes.status}` } });
    const shell = await shellRes.text();
    if (!shell.includes("<!--seo:start-->")) return next({ headers: { "x-seo-mw": "no-markers" } });

    const page = await pageFor(url);
    const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=0, must-revalidate", "x-seo-mw": "rendered" };
    if (!page) {
      const notFound: Page = { title: "Page Not Found", description: "This page doesn't exist. Browse car and inverter batteries at Kachi Batteries.", path: url.pathname, noindex: true, body: `<h1>Page not found</h1><p>${link("/", "Go to the home page")}</p>` };
      return new Response(render(shell, notFound), { status: 404, headers: { ...headers, "x-robots-tag": "noindex" } });
    }
    return new Response(render(shell, page), { status: page.status ?? 200, headers });
  } catch {
    return next({ headers: { "x-seo-mw": "error" } });
  }
}
