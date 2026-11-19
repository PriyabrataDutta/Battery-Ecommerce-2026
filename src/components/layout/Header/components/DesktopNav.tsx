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
    <nav className="hidden lg:block border-t border-line/70">
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
          <button className="px-3.5 h-9 rounded-full inline-flex items-center gap-1 text-sm font-medium text-ink hover:bg-muted transition-colors" aria-expanded={shopOpen}>
            Shop <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {shopOpen && (
            <div className="absolute left-0 top-full pt-2 z-50"><div className="rounded-2xl bg-white border border-line shadow-elevated w-[860px] p-7 grid grid-cols-4 gap-8 animate-fade-in">
              {shopMegaMenu.map((col) => (
                <MegaCol key={col.title} column={col} />
              ))}
            </div></div>
          )}
        </div>

        {/* Remaining top-level links */}
        {mainNav.slice(1).map((item) => (
          <TopLink key={item.to} to={item.to} label={item.label} />
        ))}

        <NavLink
          to="/category/clearance"
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 h-9 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden /> Clearance Sale
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
        `px-3.5 h-9 rounded-full inline-flex items-center text-sm font-medium transition-colors ${
          isActive ? "bg-ink text-white" : "text-ink hover:bg-muted"
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
      <h4 className="eyebrow mb-4">
        {column.title}
      </h4>
      <ul className="space-y-2">
        {column.items.map((it) => (
          <li key={it.to + it.label}>
            <Link to={it.to} className="text-sm text-ink-soft hover:text-primary hover:translate-x-0.5 inline-block transition-all">
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
