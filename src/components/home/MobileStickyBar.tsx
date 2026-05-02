import { Link } from "react-router-dom";
import { Search, PhoneCall } from "lucide-react";

export function MobileStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-ink border-t border-white/10 px-4 py-2.5 flex gap-2">
      <Link
        to="/shop"
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-bold uppercase tracking-wider py-2.5 rounded-md"
      >
        <Search className="h-4 w-4" />
        Find My Battery
      </Link>
      <a
        href="tel:+919999999999"
        className="flex items-center justify-center gap-2 bg-white/10 text-white text-sm font-bold uppercase tracking-wider px-4 py-2.5 rounded-md"
      >
        <PhoneCall className="h-4 w-4" />
        Call
      </a>
    </div>
  );
}
