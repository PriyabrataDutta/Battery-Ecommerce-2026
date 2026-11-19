import { Link } from "react-router-dom";
import { Search, PhoneCall } from "lucide-react";

export function MobileStickyBar() {
  return (
    <div className="fixed bottom-3 left-3 right-3 z-30 lg:hidden flex gap-2 rounded-full bg-ink/95 p-1.5 shadow-elevated backdrop-blur">
      <Link
        to="/shop"
        className="flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white"
      >
        <Search className="h-4 w-4" />
        Find my battery
      </Link>
      <a
        href="tel:+918197568707"
        className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold text-white"
      >
        <PhoneCall className="h-4 w-4" />
        Call
      </a>
    </div>
  );
}
