import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function FloatingCTAs() {
  return (
    <>
      {/* WhatsApp button */}
      <a
        href="https://wa.me/918197568707"
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-whatsapp text-white grid place-items-center shadow-elevated hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      {/* Side question tab — only show on very wide screens to avoid overlapping the price card / shop toolbar */}
      <Link
        to="/quote"
        className="hidden 2xl:flex fixed top-1/2 -right-9 z-30 -translate-y-1/2 rotate-[-90deg] origin-center bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider px-4 py-2 shadow-red hover:bg-primary-hover transition-colors"
      >
        Have a Question?
      </Link>
    </>
  );
}
