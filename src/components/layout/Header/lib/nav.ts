/**
 * Header navigation config
 * --------------------------------------------------------------
 * PURPOSE
 *   Centralised, declarative source-of-truth for everything that
 *   appears in the site header navigation. Keep ALL link/menu
 *   data here so designers / newbie devs can add or rename items
 *   without touching JSX.
 *
 * HOW TO EXTEND
 *   • Add a top-level link  → push to `mainNav`.
 *   • Shop mega menu content → components/ShopMegaMenu.tsx (data-driven).
 *   • Add a mobile-only entry → push to `mobileNav`.
 *
 * NOTE
 *   The "Shop" entry is rendered specially (mega menu) and is
 *   NOT in `mainNav`. Mobile drawer uses its own list because the
 *   ordering / labels differ slightly from desktop.
 */

export type NavItem = { label: string; to: string };

/** Desktop top-bar links (excluding "Shop" mega menu, rendered separately). */
export const mainNav: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Brands", to: "/brands" },
  { label: "Jump Start", to: "/jump-start" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/** Items shown in the mobile slide-down drawer (in order). */
export const mobileNav: (NavItem & { highlight?: boolean })[] = [
  // Car / inverter shops are tiles at the top of the drawer, so not listed here.
  { label: "Home", to: "/" },
  { label: "Battery brands", to: "/brands" },
  { label: "Jump Start", to: "/jump-start" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Clearance Sale", to: "/category/clearance", highlight: true },
];

/** Contact info shown in the utility bar. Edit phone / WA number here. */
export const contactInfo = {
  phoneDisplay: "+91 81975 68707",
  phoneTel: "tel:+918197568707",
  whatsappUrl: "https://wa.me/918197568707",
  email: "kachibatteries@gmail.com",
  storeName: "Manjunatha Batteries",
  storeCity: "Bengaluru, Karnataka",
  mapUrl: "https://maps.app.goo.gl/jFhiV7mrC53UrraL8",
  mapEmbedUrl: "https://www.google.com/maps?q=12.9582934,77.5336018&z=17&output=embed",
  utilityTagline: "Free standard delivery · Doorstep installation available",
};
