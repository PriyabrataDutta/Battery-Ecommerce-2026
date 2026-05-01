import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartSearch } from "@/components/search/SmartSearch";

/**
 * MobileSearchOverlay
 * --------------------------------------------------------------
 * Full-screen search shown on small viewports when the magnifier
 * button in the header is tapped. Locks body scroll while open.
 */
export function MobileSearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white md:hidden animate-fade-in flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-line">
        <div className="flex-1 min-w-0">
          <SmartSearch
            autoFocus
            placeholder="Search batteries, brands, models..."
            onNavigate={onClose}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close search">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
