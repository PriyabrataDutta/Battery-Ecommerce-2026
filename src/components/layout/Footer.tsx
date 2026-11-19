import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, ShieldCheck, Truck, Wrench, BadgeCheck } from "lucide-react";
import logo from "@/assets/kachi-logo.png";
import { contactInfo as c } from "./Header/lib/nav";

const columns = [
  {
    title: "Shop",
    links: [
      { to: "/category/car-batteries", label: "Car Batteries" },
      { to: "/category/inverter-ups", label: "Inverter & UPS" },
      { to: "/category/tubular", label: "Tubular" },
      { to: "/category/lithium", label: "Lithium" },
      { to: "/category/clearance", label: "Clearance Sale" },
      { to: "/brands", label: "All Brands" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/blog", label: "Blog" },
      { to: "/catalog", label: "Catalogs" },
      { to: "/jump-start", label: "Jump Start Service" },
      { to: "/quote", label: "Bulk / B2B Quote" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: "/contact", label: "Contact Us" },
      { to: "/account/orders", label: "Track My Order" },
      { to: "/refund-policy", label: "Return & Refund Policy" },
      { to: "/privacy-policy", label: "Privacy Policy" },
    ],
  },
];

const promises = [
  { Icon: BadgeCheck, label: "100% genuine brands" },
  { Icon: ShieldCheck, label: "Manufacturer warranty" },
  { Icon: Truck, label: "Free standard delivery" },
  { Icon: Wrench, label: "Doorstep installation" },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-white">
      {/* Help strip */}
      <div className="bg-gradient-red">
        <div className="container-x py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="font-display text-xl font-semibold uppercase tracking-wide">Not sure which battery fits?</p>
            <p className="text-sm text-white/85">Tell us your vehicle or inverter. We'll suggest the right one in minutes.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={c.phoneTel} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-white/90">
              <Phone className="h-4 w-4" /> {c.phoneDisplay}
            </a>
            <a href={c.whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-white/70 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>

      {/* Promises */}
      <div className="border-b border-white/10">
        <ul className="container-x grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 text-sm text-white/80">
          {promises.map(({ Icon, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 shrink-0 text-primary" /> {label}
            </li>
          ))}
        </ul>
      </div>

      {/* Links */}
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10">
        <div className="col-span-2 md:col-span-4 lg:col-span-3">
          <img src={logo} alt="Kachi Batteries" className="h-14 w-auto rounded-md bg-white p-2" />
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Genuine car, inverter and UPS batteries from Amaron, Exide, Power Zone and Elito, delivered and installed
            at your doorstep.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-white/80">
            <li>
              <a href={c.phoneTel} className="flex items-center gap-2 hover:text-white">
                <Phone className="h-4 w-4 text-primary" /> {c.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`mailto:${c.email}`} className="flex items-center gap-2 hover:text-white">
                <Mail className="h-4 w-4 text-primary" /> {c.email}
              </a>
            </li>
            <li>
              <a href={c.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-white">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>
                  {c.storeName}, {c.storeCity}
                  <span className="block text-xs text-white/50">View store on Google Maps</span>
                </span>
              </a>
            </li>
          </ul>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h4 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/70 transition-colors hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col lg:flex-row items-center justify-between gap-3 text-center text-xs text-white/50 lg:text-left">
          <p>
            © {new Date().getFullYear()} Kachi Batteries, a sister concern of {c.storeName}. All rights reserved. ·
            Designed & Developed by PDUTTA
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <span>Secure payments · Cash on Delivery available</span>
            <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-white">Returns & Refunds</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
