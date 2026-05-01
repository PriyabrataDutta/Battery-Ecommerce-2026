import { supabase } from "./client";

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
  is_default: boolean;
  updated_at: string;
}

/**
 * All addresses for the current user, default first then most-recently updated.
 */
export async function listMyAddresses(userId: string): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerAddress[];
}

/**
 * Single best-match address — used by Checkout to prefill the form.
 */
export async function getDefaultAddress(userId: string): Promise<CustomerAddress | null> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as CustomerAddress) ?? null;
}

export interface NewAddressInput {
  user_id: string;
  label: string | null;
  full_name: string;
  phone: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  gstin: string | null;
  is_default: boolean;
}

export async function createAddress(input: NewAddressInput): Promise<void> {
  const { error } = await supabase.from("customer_addresses").insert(input);
  if (error) throw error;
}

export async function setAddressAsDefault(id: string): Promise<void> {
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
  if (error) throw error;
}
