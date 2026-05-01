import { supabase } from "./client";

export interface ProfileFields {
  full_name: string | null;
  phone: string | null;
  company: string | null;
}

export async function getMyProfile(userId: string): Promise<ProfileFields | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, company")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileFields) ?? null;
}

export async function updateMyProfile(userId: string, fields: ProfileFields): Promise<void> {
  const { error } = await supabase.from("profiles").update(fields).eq("id", userId);
  if (error) throw error;
}
