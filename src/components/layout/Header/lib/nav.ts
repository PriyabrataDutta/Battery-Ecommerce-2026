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
 *   • Add a Shop mega-menu column → push to `shopMegaMenu`.
 *   • Add a mobile-only entry → push to `mobileNav`.
 *
 * NOTE
 *   The "Shop" entry is rendered specially (mega menu) and is
 *   NOT in `mainNav`. Mobile drawer uses its own list because the
 *   ordering / labels differ slightly from desktop.
 */

export type NavItem = { label: string; to: string };

export type MegaColumn = {
  title: string;
  items: NavItem[];
};

/** Desktop top-bar links (excluding "Shop" mega menu, rendered separately). */
export const mainNav: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Brands", to: "/brands" },
  { label: "Jump Start", to: "/jump-start" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/** Columns inside the desktop "Shop" mega menu. */
export const shopMegaMenu: MegaColumn[] = [
  {
    title: "Car Batteries",
    items: [
      { label: "All Car Batteries", to: "/category/car-batteries" },
      { label: "Sedans & SUVs", to: "/shop?type=car-batteries&segment=sedan-suv" },
      { label: "Hatchbacks", to: "/shop?type=car-batteries&segment=hatchback" },
      { label: "Diesel Vehicles", to: "/shop?type=car-batteries&fuel=diesel" },
      { label: "Shop by Car Model", to: "/brands" },
    ],
  },
  {
    title: "Inverter Batteries & UPS",
    items: [
      { label: "All Inverter Batteries", to: "/category/inverter-ups" },
      { label: "Tubular", to: "/category/tubular" },
      { label: "SMF / VRLA", to: "/category/smf" },
      { label: "Lithium", to: "/category/lithium" },
      { label: "Home UPS", to: "/category/home-ups" },
    ],
  },
  {
    title: "Battery by Brand",
    items: [
      { label: "Amaron", to: "/brand/amaron" },
      { label: "Exide", to: "/brand/exide" },
      { label: "Power Zone", to: "/brand/power-zone" },
      { label: "Elito", to: "/brand/elito" },
      { label: "View all brands", to: "/brands" },
    ],
  },
  {
    title: "Offers",
    items: [
      { label: "Clearance Sale", to: "/category/clearance" },
      { label: "On Sale Now", to: "/shop?onSale=1" },
      { label: "New Arrivals", to: "/shop?isNew=1" },
      { label: "Bestsellers", to: "/shop?bestseller=1" },
      { label: "Exchange & Save", to: "/shop?exchange=1" },
    ],
  },
];

/** Items shown in the mobile slide-down drawer (in order). */
export const mobileNav: (NavItem & { highlight?: boolean })[] = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Brands", to: "/brands" },
  { label: "Jump Start", to: "/jump-start" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Clearance Sale", to: "/category/clearance", highlight: true },
];

/** Contact info shown in the utility bar. Edit phone / WA number here. */
export const contactInfo = {
  phoneDisplay: "+91 99999 99999",
  phoneTel: "tel:+919999999999",
  whatsappUrl: "https://wa.me/919999999999",
  utilityTagline: "Free shipping & doorstep installation across India",
};
