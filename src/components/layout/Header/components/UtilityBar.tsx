import { Phone, MessageCircle } from "lucide-react";
import { contactInfo } from "../lib/nav";

/**
 * UtilityBar
 * --------------------------------------------------------------
 * The thin dark strip above the main header containing phone,
 * WhatsApp, and the marketing tagline. Edit copy / numbers in
 * `../lib/nav.ts` (contactInfo) — not here.
 */
export function UtilityBar() {
  return (
    <div className="bg-ink text-white/90 text-xs">
      <div className="container-x flex items-center justify-center sm:justify-between h-9 gap-4">
        <div className="flex items-center gap-4 sm:gap-5">
          <a
            href={contactInfo.phoneTel}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Phone className="h-3 w-3" />
            <span className="hidden sm:inline">{contactInfo.phoneDisplay}</span>
            <span className="sm:hidden">Call us</span>
          </a>
          <a
            href={contactInfo.whatsappUrl}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </a>
        </div>
        <div className="hidden md:flex items-center gap-2 text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-volt animate-pulse" aria-hidden />
          {contactInfo.utilityTagline}
        </div>
      </div>
    </div>
  );
}
