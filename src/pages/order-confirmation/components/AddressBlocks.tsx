import { MapPin, Mail } from "lucide-react";
import type { SavedOrder } from "../lib/types";

/**
 * AddressBlocks
 * --------------------------------------------------------------
 * Two-up grid showing the shipping address and the contact email.
 * Receives only the order's `address` slice so it can be re-used
 * elsewhere (e.g. account/orders detail) if needed.
 */
export function AddressBlocks({ address }: { address: SavedOrder["address"] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <InfoBlock title="Shipping address" icon={MapPin}>
        <div className="text-sm">
          <div className="font-semibold">{address.fullName}</div>
          <div>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </div>
          <div>
            {address.city}, {address.state} – {address.pincode}
          </div>
          <div className="mt-1 text-muted-foreground">{address.phone}</div>
          {address.gstin && (
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">GSTIN:</span>{" "}
              <span className="font-mono font-semibold tracking-wider">{address.gstin}</span>
            </div>
          )}
        </div>
      </InfoBlock>
      <InfoBlock title="Contact" icon={Mail}>
        <div className="text-sm">
          <div>{address.email}</div>
          <div className="mt-1 text-muted-foreground">
            Updates and tracking info will be sent here.
          </div>
        </div>
      </InfoBlock>
    </div>
  );
}

function InfoBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-line p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="font-display font-bold uppercase tracking-wide text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}
