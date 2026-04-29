import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  User,
  MapPin,
  Heart,
  FileText,
  MessageSquare,
  LogOut,
  Shield,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/RequireAuth";

/**
 * Customer dashboard shell. The sidebar nav uses NavLink so the active route
 * is highlighted by react-router. Layout matches the storefront tone — flat
 * panels, hairline dividers, no card shadows. Uses semantic tokens only.
 */
const NAV: { to: string; label: string; icon: typeof Package; end?: boolean }[] = [
  { to: "/account", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/account/orders", label: "Orders", icon: Package },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/quotes", label: "Quote Requests", icon: FileText },
  { to: "/account/support", label: "Support", icon: MessageSquare },
  { to: "/account/profile", label: "Profile", icon: User },
];

const AccountLayout = () => {
  const { user, isStaff, signOut } = useAuth();
  const location = useLocation();

  return (
    <RequireAuth>
      <div className="container-x py-10">
        <div className="mb-6">
          <h1 className="font-display-tight text-3xl md:text-4xl font-bold">My Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Signed in as <span className="font-semibold text-ink">{user?.email}</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="bg-white border border-line p-3 h-fit lg:sticky lg:top-32">
            <nav>
              <ul className="space-y-0.5">
                {NAV.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-3 px-3 py-2 text-sm font-display font-semibold border-l-2 transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border-primary"
                            : "border-transparent text-ink-soft hover:text-ink hover:bg-muted/50",
                        ].join(" ")
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-line mt-3 pt-3 space-y-1">
              {isStaff && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <NavLink to="/admin">
                    <Shield className="h-4 w-4 mr-2" /> Open Admin
                  </NavLink>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <NavLink to="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Continue Shopping
                </NavLink>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>
            </div>
          </aside>

          {/* Content */}
          <main key={location.pathname} className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </RequireAuth>
  );
};

export default AccountLayout;
