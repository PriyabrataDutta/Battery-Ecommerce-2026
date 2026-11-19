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
      { label: "Find by your car", to: "/shop/car-batteries" },
      { label: "Maruti Suzuki", to: "/shop/car-batteries?car_brand=maruti-suzuki" },
      { label: "Hyundai", to: "/shop/car-batteries?car_brand=hyundai" },
      { label: "Tata", to: "/shop/car-batteries?car_brand=tata" },
      { label: "Mahindra", to: "/shop/car-batteries?car_brand=mahindra" },
    ],
  },
  {
    title: "Inverter Batteries & UPS",
    items: [
      { label: "Backup calculator", to: "/shop/inverter-batteries" },
      { label: "Tubular", to: "/shop/inverter-batteries?kind=tubular" },
      { label: "SMF / VRLA", to: "/shop/inverter-batteries?kind=smf" },
      { label: "Lithium", to: "/shop/inverter-batteries?kind=lithium" },
      { label: "Inverters & UPS", to: "/shop/inverter-batteries?kind=inverter-ups" },
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
  { label: "Car batteries", to: "/shop/car-batteries" },
  { label: "Inverter batteries", to: "/shop/inverter-batteries" },
  { label: "Brands", to: "/brands" },
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
