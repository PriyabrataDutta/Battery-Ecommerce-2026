import { Link } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import logo from "@/assets/kachi-logo.png";
import { Button } from "@/components/ui/button";
import { SmartSearch } from "@/components/search/SmartSearch";
import { CartButton } from "./CartButton";
import { AccountMenu } from "./AccountMenu";

/**
 * MainBar
 * --------------------------------------------------------------
 * The middle band of the header: hamburger (mobile), logo,
 * search bar (desktop), cart, account, and the desktop CTA.
 *
 * It's intentionally a "dumb" presentational shell — all open/close
 * state lives in the parent `Header` so the same state can drive
 * the drawer / overlays rendered as siblings.
 */
export function MainBar({
  mobileOpen,
  onToggleMobile,
  onOpenMobileSearch,
  onOpenCartDrawer,
}: {
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onOpenMobileSearch: () => void;
  onOpenCartDrawer: () => void;
}) {
  return (
    <div className="container-x flex flex-nowrap items-center gap-2 sm:gap-4 lg:gap-6 h-14 sm:h-16 lg:h-20 min-w-0">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden -ml-1.5 h-11 w-11 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={onToggleMobile}
        aria-label="Menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <Link to="/" className="flex-shrink-0 flex items-center">
        <img src={logo} alt="Kachi Batteries" className="h-9 sm:h-12 lg:h-16 w-auto drop-shadow-sm" />
      </Link>

      <SmartSearch className="hidden md:flex flex-1 min-w-0 items-center" />

      <div className="ml-auto -mr-1 sm:mr-0 flex flex-shrink-0 flex-nowrap items-center gap-0.5 sm:gap-1.5 lg:gap-2 whitespace-nowrap">
        {/* Shared icon-button styling: muted hover bg, primary icon on hover, 2px primary focus ring.
            Mobile uses 44px tap targets per WCAG; desktop tightens to 40px. */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11 text-ink hover:bg-muted hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={onOpenMobileSearch}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </Button>

        <CartButton onOpenDrawer={onOpenCartDrawer} />
        <AccountMenu />

        <Button
          asChild
          className="hidden lg:inline-flex h-10 ml-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          size="sm"
        >
          <Link to="/quote">Request Call Back</Link>
        </Button>
      </div>
    </div>
  );
}
