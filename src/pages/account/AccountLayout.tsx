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
import { Link, Navigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAccountTab, isAccountTab, type AccountTab } from "@/stores/dashboardTabs";
import AccountOverview from "@/pages/account/AccountOverview";
import AccountOrders from "@/pages/account/AccountOrders";
import AccountAddresses from "@/pages/account/AccountAddresses";
import AccountProfile from "@/pages/account/AccountProfile";
import AccountWishlist from "@/pages/account/AccountWishlist";
import AccountQuotes from "@/pages/account/AccountQuotes";
import AccountSupport from "@/pages/account/AccountSupport";

/**
 * Single-route customer dashboard. Active section is driven by a persisted
 * zustand store (`useAccountTab`) instead of nested routes.
 */
const NAV: { tab: AccountTab; label: string; icon: typeof Package }[] = [
  { tab: "overview", label: "Overview", icon: LayoutDashboard },
  { tab: "orders", label: "Orders", icon: Package },
  { tab: "addresses", label: "Addresses", icon: MapPin },
  { tab: "wishlist", label: "Wishlist", icon: Heart },
  { tab: "quotes", label: "Quote Requests", icon: FileText },
  { tab: "support", label: "Support", icon: MessageSquare },
  { tab: "profile", label: "Profile", icon: User },
];

const PANELS: Record<AccountTab, () => JSX.Element> = {
  overview: AccountOverview,
  orders: AccountOrders,
  addresses: AccountAddresses,
  wishlist: AccountWishlist,
  quotes: AccountQuotes,
  support: AccountSupport,
  profile: AccountProfile,
};

const AccountLayout = () => {
  const { user, isStaff, signOut } = useAuth();
  const { tab: urlTab } = useParams<{ tab?: string }>();
  const { tab: storeTab, setTab } = useAccountTab();

  // Invalid URL tab → redirect to bare /account
  if (urlTab !== undefined && !isAccountTab(urlTab)) {
    return <Navigate to="/account" replace />;
  }

  const tab: AccountTab = isAccountTab(urlTab) ? urlTab : storeTab;

  // Keep persisted store in sync with URL so reopening /account lands on the same tab.
  useEffect(() => {
    if (tab !== storeTab) setTab(tab);
  }, [tab, storeTab, setTab]);

  const ActivePanel = PANELS[tab] ?? AccountOverview;

  return (
    <RequireAuth>
      <div className="container-x py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-red font-display text-xl font-bold text-white shadow-red" aria-hidden>
            {(user?.email?.[0] ?? "K").toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="eyebrow">Account</span>
            <h1 className="font-display-tight text-3xl md:text-4xl font-bold">My Account</h1>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              Signed in as <span className="font-semibold text-ink">{user?.email}</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside className="surface p-2 sm:p-3 h-fit lg:sticky lg:top-32 min-w-0">
            <nav aria-label="Account sections">
              <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:block lg:space-y-1">
                {NAV.map(({ tab: t, label, icon: Icon }) => {
                  const active = tab === t;
                  return (
                    <li key={t} className="shrink-0">
                      <Link
                        to={`/account/${t}`}
                        onClick={() => setTab(t)}
                        className={[
                          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors text-left",
                          active
                            ? "bg-ink text-white"
                            : "text-ink-soft hover:text-ink hover:bg-muted",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="border-t border-line mt-2 pt-2 lg:mt-3 lg:pt-3 grid grid-cols-2 gap-1 lg:block lg:space-y-1">
              {isStaff && (
                <Button asChild variant="outline" size="sm" className="w-full justify-start">
                  <Link to="/admin">
                    <Shield className="h-4 w-4 mr-2" /> Open Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="ghost" size="sm" className="w-full justify-start">
                <Link to="/shop">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Continue Shopping
                </Link>
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
          <main key={tab} className="min-w-0">
            <ActivePanel />
          </main>
        </div>
      </div>
    </RequireAuth>
  );
};

export default AccountLayout;
