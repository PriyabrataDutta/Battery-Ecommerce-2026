import { Link, NavLink } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, Phone, MessageCircle, ChevronDown, X, LogOut, UserPlus, Package, MapPin, UserCircle, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/kachi-logo.png";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { SmartSearch } from "@/components/search/SmartSearch";
import { CartDrawer } from "@/components/cart/CartDrawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { label: "Home", to: "/" },
  { label: "Brands", to: "/brands" },
  { label: "Jump Start", to: "/jump-start" },
  { label: "Blog", to: "/blog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export function Header() {
  const { count } = useCart();
  const { user, loading, signOut, isStaff } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountCloseTimer, setAccountCloseTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const openAccount = () => {
    if (accountCloseTimer) {
      clearTimeout(accountCloseTimer);
      setAccountCloseTimer(null);
    }
    setAccountOpen(true);
  };
  const scheduleCloseAccount = () => {
    if (accountCloseTimer) clearTimeout(accountCloseTimer);
    const t = setTimeout(() => setAccountOpen(false), 150);
    setAccountCloseTimer(t);
  };
  const closeAccountNow = () => {
    if (accountCloseTimer) {
      clearTimeout(accountCloseTimer);
      setAccountCloseTimer(null);
    }
    setAccountOpen(false);
  };
  const handleAccountKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape" && accountOpen) {
      e.stopPropagation();
      closeAccountNow();
    }
  };
  const handleAccountBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    // Radix portals the menu content outside this wrapper, so blur fires when
    // the menu opens and steals focus. Ignore blur whose related target is the
    // Radix dropdown content (data-radix-menu-content) — Escape / outside click
    // / mouse-leave already handle dismissal.
    const next = e.relatedTarget as HTMLElement | null;
    if (next && next.closest("[data-radix-menu-content], [data-radix-popper-content-wrapper]")) {
      return;
    }
    if (!e.currentTarget.contains(next as Node | null)) {
      closeAccountNow();
    }
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    if (mobileSearchOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [mobileSearchOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-line">
      {/* Utility bar */}
      <div className="bg-ink text-white text-xs">
        <div className="container-x flex items-center justify-center sm:justify-between h-9 gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            <a
              href="tel:+919999999999"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">+91 99999 99999</span>
              <span className="sm:hidden">Call us</span>
            </a>
            <a
              href="https://wa.me/919999999999"
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </a>
          </div>
          <div className="hidden md:block text-white/80">
            Free shipping &amp; doorstep installation across India
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-x flex flex-nowrap items-center gap-2 sm:gap-4 lg:gap-6 h-14 sm:h-16 lg:h-20 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden -ml-1.5 h-11 w-11 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img src={logo} alt="Kachi Batteries" className="h-9 sm:h-12 lg:h-16 w-auto drop-shadow-sm" />
        </Link>

        <SmartSearch className="hidden md:flex flex-1 min-w-0 items-center" />

        <div className="ml-auto -mr-1 sm:mr-0 flex flex-shrink-0 flex-nowrap items-center gap-0.5 sm:gap-1.5 lg:gap-2 whitespace-nowrap">
          {/* Shared icon button styling: gray (muted) hover bg, red (primary) icon on hover, 2px primary focus ring with offset.
              Mobile uses 44px tap targets per WCAG; desktop uses tighter 40px. */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-11 w-11 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setMobileSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative h-11 w-11 sm:h-10 sm:w-10 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Link
              to="/cart"
              aria-label="Cart"
              onClick={(e) => {
                // Open slide-in drawer on mobile/tablet (<1024px); navigate on desktop.
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  e.preventDefault();
                  setCartDrawerOpen(true);
                }
              }}
            >
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1 grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {user ? (
            <div
              className="inline-flex"
              onMouseEnter={openAccount}
              onMouseLeave={scheduleCloseAccount}
              onFocus={openAccount}
              onBlur={handleAccountBlur}
              onKeyDown={handleAccountKeyDown}
            >
              <DropdownMenu open={accountOpen} onOpenChange={setAccountOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 sm:h-10 sm:w-10 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-label="Account menu"
                  >
                    <Link to="/account" onClick={() => setAccountOpen(false)}>
                      <User className="h-5 w-5" />
                    </Link>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  className="w-56 bg-white z-50"
                  onMouseEnter={openAccount}
                  onMouseLeave={scheduleCloseAccount}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-normal">Signed in as</span>
                    <span className="truncate text-sm">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="cursor-pointer">
                      <UserCircle className="h-4 w-4 mr-2" /> My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/orders" className="cursor-pointer">
                      <Package className="h-4 w-4 mr-2" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/addresses" className="cursor-pointer">
                      <MapPin className="h-4 w-4 mr-2" /> Addresses
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {isStaff && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 mr-2" /> Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="cursor-pointer text-primary focus:text-primary"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
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
          )}
          <Button asChild className="hidden lg:inline-flex h-10 ml-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" size="sm">
            <Link to="/quote">Request Call Back</Link>
          </Button>
        </div>
      </div>

      {/* Mobile full-screen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-white md:hidden animate-fade-in flex flex-col">
          <div className="flex items-center gap-2 p-3 border-b border-line">
            <div className="flex-1 min-w-0">
              <SmartSearch
                autoFocus
                placeholder="Search batteries, brands, models..."
                onNavigate={() => setMobileSearchOpen(false)}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileSearchOpen(false)}
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Main menu */}
      <nav className="hidden lg:block border-t border-line bg-white">
        <div className="container-x flex items-center gap-1 h-12">
          {mainNav.slice(0, 1).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `px-4 h-12 inline-flex items-center text-sm font-medium hover:text-primary transition-colors ${isActive ? "text-primary" : "text-ink"}`}>
              {item.label}
            </NavLink>
          ))}

          {/* Shop with mega menu */}
          <div className="relative" onMouseEnter={() => setShopOpen(true)} onMouseLeave={() => setShopOpen(false)}>
            <button className="px-4 h-12 inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-primary">
              Shop <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {shopOpen && (
              <div className="absolute left-0 top-full bg-white border border-line shadow-elevated w-[640px] p-6 grid grid-cols-3 gap-6 animate-fade-in z-50">
                <MegaCol title="Car Batteries" items={[
                  { label: "All Car Batteries", to: "/category/car-batteries" },
                  { label: "Sedans & SUVs", to: "/shop?type=car-batteries" },
                  { label: "Hatchbacks", to: "/shop?type=car-batteries" },
                ]} />
                <MegaCol title="Inverter & UPS" items={[
                  { label: "All Inverter Batteries", to: "/category/inverter-ups" },
                  { label: "Tubular", to: "/category/tubular" },
                  { label: "SMF", to: "/category/smf" },
                  { label: "Lithium", to: "/category/lithium" },
                ]} />
                <MegaCol title="Battery by Brand" items={[
                  { label: "Amaron", to: "/brand/amaron" },
                  { label: "Exide", to: "/brand/exide" },
                  { label: "Power Zone", to: "/brand/power-zone" },
                  { label: "Elito", to: "/brand/elito" },
                ]} />
              </div>
            )}
          </div>

          {mainNav.slice(1).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `px-4 h-12 inline-flex items-center text-sm font-medium hover:text-primary transition-colors ${isActive ? "text-primary" : "text-ink"}`}>
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/category/clearance" className="ml-auto px-4 h-12 inline-flex items-center text-sm font-bold text-primary uppercase tracking-wide">
            Clearance Sale
          </NavLink>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-white animate-fade-in">
          <div className="p-4 border-b border-line">
            <SmartSearch onNavigate={() => setMobileOpen(false)} />
          </div>
          <div className="flex flex-col py-2">
            <MobileLink to="/" label="Home" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/shop" label="Shop" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/brands" label="Brands" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/jump-start" label="Jump Start" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/blog" label="Blog" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/about" label="About" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/contact" label="Contact" onClick={() => setMobileOpen(false)} />
            <MobileLink to="/category/clearance" label="Clearance Sale" highlight onClick={() => setMobileOpen(false)} />
            <div className="p-4 border-t border-line">
              <Button asChild className="w-full">
                <Link to="/quote" onClick={() => setMobileOpen(false)}>Request Call Back</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile slide-in cart drawer */}
      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </header>
  );
}

function MegaCol({ title, items }: { title: string; items: { label: string; to: string }[] }) {
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">{title}</h4>
      <ul className="space-y-2">
        {items.map((it) => (
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

function MobileLink({ to, label, highlight, onClick }: { to: string; label: string; highlight?: boolean; onClick: () => void }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-4 py-3 text-sm font-medium border-b border-line ${
          highlight ? "text-primary uppercase tracking-wide" : isActive ? "text-primary" : "text-ink"
        }`
      }
    >
      {label}
    </NavLink>
  );
}
