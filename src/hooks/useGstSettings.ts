import { useQuery } from "@tanstack/react-query";
import { getSetting } from "@/api/settings";

export interface GstSettings {
  gst_rate: number;
  gstin: string;
  business_name: string;
  state: string;
  show_breakup: boolean;
}

const DEFAULTS: GstSettings = {
  gst_rate: 18,
  gstin: "",
  business_name: "",
  state: "",
  show_breakup: false,
};

export function useGstSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ["gst-settings"],
    queryFn: () => getSetting<GstSettings>("gst_settings"),
    staleTime: 5 * 60_000,
  });

  return {
    settings: data ? { ...DEFAULTS, ...data } : DEFAULTS,
    taxRate: (data?.gst_rate ?? DEFAULTS.gst_rate) / 100,
    loading: isLoading,
  };
}
