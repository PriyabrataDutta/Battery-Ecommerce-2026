import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { mainNav, shopMegaMenu, type MegaColumn } from "../lib/nav";

/**
 * DesktopNav
 * --------------------------------------------------------------
 * The lower navigation bar visible on `lg` screens and above.
 * Renders top-level links + the "Shop" mega menu + a clearance
 * call-out pinned to the right.
 *
 * Edit links / mega-menu data in `../lib/nav.ts`.
 */
export function DesktopNav() {
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <nav className="hidden lg:block border-t border-line bg-white">
      <div className="container-x flex items-center gap-1 h-12">
        {/* First link (Home) */}
        {mainNav.slice(0, 1).map((item) => (
          <TopLink key={item.to} to={item.to} label={item.label} />
        ))}

        {/* Shop with mega menu */}
        <div
          className="relative"
          onMouseEnter={() => setShopOpen(true)}
          onMouseLeave={() => setShopOpen(false)}
        >
          <button className="px-4 h-12 inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-primary">
            Shop <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {shopOpen && (
            <div className="absolute left-0 top-full bg-white border border-line shadow-elevated w-[860px] p-6 grid grid-cols-4 gap-6 animate-fade-in z-50">
              {shopMegaMenu.map((col) => (
                <MegaCol key={col.title} column={col} />
              ))}
            </div>
          )}
        </div>

        {/* Remaining top-level links */}
        {mainNav.slice(1).map((item) => (
          <TopLink key={item.to} to={item.to} label={item.label} />
        ))}

        <NavLink
          to="/category/clearance"
          className="ml-auto px-4 h-12 inline-flex items-center text-sm font-bold text-primary uppercase tracking-wide"
        >
          Clearance Sale
        </NavLink>
      </div>
    </nav>
  );
}

function TopLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-4 h-12 inline-flex items-center text-sm font-medium hover:text-primary transition-colors ${
          isActive ? "text-primary" : "text-ink"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function MegaCol({ column }: { column: MegaColumn }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
        {column.title}
      </h4>
      <ul className="space-y-2">
        {column.items.map((it) => (
          <li key={it.to + it.label}>
            <Link to={it.to} className="text-sm text-ink-soft hover:text-primary transition-colors">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
