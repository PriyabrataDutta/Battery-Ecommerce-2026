import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/kachi-logo.png";

export function Footer() {
  return (
    <footer className="bg-ink text-white mt-20">
      <div className="container-x py-14 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
        <div className="col-span-2 lg:col-span-2">
          <img src={logo} alt="Kachi Batteries" className="h-14 w-auto bg-white p-2 rounded-md" />
          <p className="mt-4 text-sm text-white/70 max-w-sm">
            India's trusted source for genuine car batteries, inverter batteries and UPS systems. Free shipping & free
            installation across major cities.
          </p>
          <div className="mt-5 space-y-2 text-sm text-white/70">
            <a href="tel:+919999999999" className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4 text-primary" /> +91 99999 99999
            </a>
            <a href="mailto:hello@kachibatteries.com" className="flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4 text-primary" /> hello@kachibatteries.com
            </a>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" /> Mumbai · Pune · Bangalore · Delhi
            </div>
          </div>
        </div>

        <FooterCol
          title="Shop"
          links={[
            { to: "/category/car-batteries", label: "Car Batteries" },
            { to: "/category/inverter-ups", label: "Inverter & UPS" },
            { to: "/category/tubular", label: "Tubular" },
            { to: "/category/lithium", label: "Lithium" },
            { to: "/category/clearance", label: "Clearance" },
          ]}
        />

        <FooterCol
          title="Brands"
          links={[
            { to: "/brand/amaron", label: "Amaron" },
            { to: "/brand/exide", label: "Exide" },
            { to: "/brand/power-zone", label: "Power Zone" },
            { to: "/brand/elito", label: "Elito" },
          ]}
        />

        <FooterCol
          title="Company"
          links={[
            { to: "/about", label: "About Us" },
            { to: "/contact", label: "Contact" },
            { to: "/quote", label: "Request Quote" },
            { to: "/jump-start", label: "Jump Start" },
            { to: "/catalog", label: "Catalogs" },
            { to: "/blog", label: "Blog" },
            { to: "/privacy-policy", label: "Privacy Policy" },
            { to: "/refund-policy", label: "Return & Refund Policy" },
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>© {new Date().getFullYear()} Kachi Batteries. All rights reserved. Designed & Developed by PDUTTA</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-white">Return & Refund Policy</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="Facebook" className="hover:text-white">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Instagram" className="hover:text-white">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-white">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 text-white">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-sm text-white/70 hover:text-primary transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
