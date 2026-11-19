import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "@/lib/site";

export const SITE_NAME = "Kachi Batteries";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.jpg`;

type JsonLd = Record<string, unknown>;

interface SeoProps {
  /** Page title without the brand; " | Kachi Batteries" is appended. */
  title: string;
  description: string;
  /** Path for the canonical URL. Defaults to the current path without query string. */
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "product";
  /** Keep the page out of search results (cart, checkout, account, auth...). */
  noindex?: boolean;
  jsonLd?: JsonLd | JsonLd[];
  /** Breadcrumb trail (excluding Home), rendered as BreadcrumbList JSON-LD. */
  breadcrumbs?: { name: string; path: string }[];
}

/** Single place for page title, description, canonical, Open Graph, Twitter and JSON-LD. */
export function Seo({ title, description, path, image, type = "website", noindex, jsonLd, breadcrumbs }: SeoProps) {
  const { pathname } = useLocation();
  const url = `${SITE_URL}${path ?? pathname}`;
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const desc = description.length > 160 ? `${description.slice(0, 157).trimEnd()}…` : description;
  const img = image || DEFAULT_OG_IMAGE;

  const blocks: JsonLd[] = [...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])];
  if (breadcrumbs?.length) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Home", path: "/" }, ...breadcrumbs].map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${SITE_URL}${b.path}`,
      })),
    });
  }

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? <meta name="robots" content="noindex, follow" /> : <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="en_IN" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
}
