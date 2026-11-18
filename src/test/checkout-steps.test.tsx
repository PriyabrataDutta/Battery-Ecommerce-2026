import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AddressStep } from "@/pages/checkout/components/AddressStep";
import { DeliveryStep } from "@/pages/checkout/components/DeliveryStep";
import { Truck } from "lucide-react";

const address = { fullName: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "", gstin: "", notes: "" };
const noop = () => {};

describe("checkout steps show instructions and block on errors", () => {
  it("address step: instructions under fields + error summary", () => {
    render(
      <AddressStep address={address} setAddress={noop} clearError={noop} onBlurField={noop}
        errors={{ phone: "Enter a valid 10-digit Indian mobile number", pincode: "Enter a valid 6-digit Indian PIN code" }} />,
    );
    expect(screen.getByText(/are required/)).toBeTruthy();
    expect(screen.getByText(/10-digit mobile for delivery updates/)).toBeTruthy();
    expect(screen.getByText(/Please fix 2 fields to continue/)).toBeTruthy();
  });

  it("delivery step: installation slot makes notes required with a checklist and counter", () => {
    render(
      <DeliveryStep options={[{ id: "installation", label: "Doorstep Installation", eta: "2–4 days", price: 499, icon: Truck }]}
        delivery="installation" setDelivery={noop} notes="Swift" setNotes={noop}
        deliveryDate={undefined} setDeliveryDate={noop} slot="install_morning" setSlot={noop} scheduleError="" />,
    );
    expect(screen.getByText("Installation notes")).toBeTruthy();
    expect(screen.getByText(/Required for "Morning Install" — at least 10 characters/)).toBeTruthy();
    expect(screen.getByText(/Vehicle make, model and fuel type/)).toBeTruthy();
    expect(screen.getByText(/5 \/ 10 min — 5 more/)).toBeTruthy();
  });
});
