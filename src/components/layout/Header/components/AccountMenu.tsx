import { Link } from "react-router-dom";
import {
  User,
  UserPlus,
  UserCircle,
  Package,
  MapPin,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMenu } from "../hooks/useAccountMenu";

/**
 * AccountMenu
 * --------------------------------------------------------------
 * Hover/focus-driven account dropdown shown when a user is signed
 * in. Falls back to a "Login/Signup" CTA when signed out.
 *
 * To add a new menu link (e.g. "Wishlist"):
 *   1) Import the icon from lucide-react.
 *   2) Add a <Link …> block in the menu list below following the
 *      same className convention.
 *   3) If the link is admin-only, gate it behind `isStaff`.
 */
export function AccountMenu() {
  const { user, signOut, isStaff } = useAuth();
  const { open, openNow, scheduleClose, closeNow, onKeyDown, onBlur } = useAccountMenu();

  if (!user) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="inline-flex h-11 sm:h-10 w-11 sm:w-auto px-0 sm:px-3 gap-1.5 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Link to="/auth" aria-label="Login or sign up">
          <span className="hidden sm:inline text-sm font-medium">Login/Signup</span>
          <UserPlus className="h-5 w-5 sm:h-4 sm:w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={openNow}
      onMouseLeave={scheduleClose}
      onFocus={openNow}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    >
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-11 w-11 sm:h-10 sm:w-10 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Link to="/account" onClick={closeNow}>
          <User className="h-5 w-5" />
        </Link>
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full w-56 bg-white border border-line rounded-md shadow-elevated z-50 py-1"
        >
          {/* Hover bridge so the cursor can cross trigger→menu without firing mouseleave */}
          <span className="absolute -top-2 left-0 right-0 h-2" aria-hidden="true" />

          <div className="px-3 py-2 flex flex-col gap-0.5 border-b border-line">
            <span className="text-[11px] text-muted-foreground">Signed in as</span>
            <span className="truncate text-sm font-medium text-ink">{user.email}</span>
          </div>

          <MenuLink to="/account" icon={<UserCircle className="h-4 w-4" />} label="My Account" onClick={closeNow} />
          <MenuLink to="/account/orders" icon={<Package className="h-4 w-4" />} label="My Orders" onClick={closeNow} />
          <MenuLink to="/account/addresses" icon={<MapPin className="h-4 w-4" />} label="Addresses" onClick={closeNow} />
          <MenuLink to="/account/profile" icon={<User className="h-4 w-4" />} label="Profile" onClick={closeNow} />

          {isStaff && (
            <Link
              to="/admin"
              onClick={closeNow}
              className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-muted hover:text-primary border-t border-line"
              role="menuitem"
            >
              <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              closeNow();
              signOut();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted border-t border-line text-left"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon,
  label,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-muted hover:text-primary"
      role="menuitem"
    >
      {icon} {label}
    </Link>
  );
}
