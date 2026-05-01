import { supabase } from "./client";

export interface Offer {
  id: string;
  title: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  min_order_total: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  applies_to: Record<string, unknown>;
}

export async function listActiveOffers(): Promise<Offer[]> {
  const { data, error } = await supabase
    .from("offers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Offer[];
}
