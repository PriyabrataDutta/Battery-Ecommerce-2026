import { useQuery } from "@tanstack/react-query";
import { getSetting } from "@/api/settings";
import type { DeliveryOption, DeliveryId } from "@/pages/checkout/lib/types";
import { Truck, ShieldCheck } from "lucide-react";

interface ShippingMethod {
  id: string;
  label: string;
  eta: string;
  price: number;
}

interface ShippingSettings {
  methods: ShippingMethod[];
  free_threshold: number;
}

const DEFAULT_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Standard Doorstep Delivery", eta: "3–5 business days", price: 0 },
  { id: "express", label: "Express Delivery", eta: "1–2 business days", price: 299 },
  { id: "installation", label: "Doorstep Installation + Old Battery Pickup", eta: "2–4 business days", price: 499 },
];

const ICON_MAP: Record<string, typeof Truck> = {
  standard: Truck,
  express: Truck,
  installation: ShieldCheck,
};

export function useShippingSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["shipping-settings"],
    queryFn: () => getSetting<ShippingSettings>("shipping_settings"),
    staleTime: 5 * 60_000,
  });

  const methods = data?.methods?.length ? data.methods : DEFAULT_METHODS;
  const freeThreshold = data?.free_threshold ?? 0;

  const deliveryOptions: DeliveryOption[] = methods.map((m) => ({
    id: m.id as DeliveryId,
    label: m.label,
    eta: m.eta,
    price: m.price,
    icon: ICON_MAP[m.id] ?? Truck,
  }));

  return {
    deliveryOptions,
    freeThreshold,
    loading: isLoading,
  };
}
