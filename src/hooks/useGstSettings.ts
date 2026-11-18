import { useQuery } from "@tanstack/react-query";
import { getSetting } from "@/api/settings";
import { supabase } from "@/integrations/supabase/client";

export interface GstSettings {
  gstin: string;
  business_name: string;
  state: string;
  show_breakup: boolean;
}

export interface GstRate {
  id: string;
  label: string;
  rate: number;
  hsn_code: string | null;
  is_default: boolean;
}

const DEFAULTS: GstSettings = {
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

  const settings = data ? { ...DEFAULTS, ...data } : DEFAULTS;

  return { settings, loading: isLoading };
}

/** Fetch all GST rate slabs from the gst_rates table */
export function useGstRates() {
  return useQuery<GstRate[]>({
    queryKey: ["gst-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gst_rates")
        .select("id, label, rate, hsn_code, is_default")
        .order("rate");
      if (error) throw error;
      return (data ?? []) as GstRate[];
    },
    staleTime: 5 * 60_000,
  });
}
