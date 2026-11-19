import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { mobileNav } from "../lib/nav";

/**
 * MobileDrawer
 * --------------------------------------------------------------
 * Slide-down navigation visible on screens below `lg`. Lists are
 * sourced from `../lib/nav.ts` (`mobileNav`).
 */
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div className="lg:hidden border-t border-line bg-white animate-fade-in">
      <div className="flex flex-col py-2">
        {mobileNav.map((item) => (
          <MobileLink
            key={item.to}
            to={item.to}
            label={item.label}
            highlight={item.highlight}
            onClick={onClose}
          />
        ))}
        <div className="p-4 border-t border-line">
          <Button asChild className="w-full">
            <Link to="/quote" onClick={onClose}>
              Request Call Back
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function MobileLink({
  to,
  label,
  highlight,
  onClick,
}: {
  to: string;
  label: string;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `mx-3 my-0.5 rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
          highlight
            ? "bg-primary/10 text-primary font-semibold"
            : isActive
            ? "bg-ink text-white"
            : "text-ink hover:bg-muted"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
