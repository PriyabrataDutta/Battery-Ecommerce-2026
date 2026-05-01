// Brand-specific placeholder images for products without a primary image.
const PLACEHOLDERS = {
  exide: "https://www.kachibatteries.com/wp-content/uploads/2026/02/EXIDE-BATTERY-300x300.webp",
  amaron: "https://www.kachibatteries.com/wp-content/uploads/2026/02/Amaron.webp",
  powerzone: "https://www.kachibatteries.com/wp-content/uploads/2026/02/POWER-ZONE.webp",
} as const;

const DEFAULT_PLACEHOLDER = PLACEHOLDERS.amaron;

/**
 * Returns the product image URL, or a brand-specific placeholder if missing.
 */
export function getProductImage(
  primaryImageUrl: string | null | undefined,
  brandName?: string | null,
): string {
  if (primaryImageUrl) return primaryImageUrl;
  if (!brandName) return DEFAULT_PLACEHOLDER;
  const key = brandName.toLowerCase().replace(/[\s-]/g, "");
  if (key.includes("exide")) return PLACEHOLDERS.exide;
  if (key.includes("amaron")) return PLACEHOLDERS.amaron;
  if (key.includes("power") || key.includes("zone")) return PLACEHOLDERS.powerzone;
  return DEFAULT_PLACEHOLDER;
}
