import { supabase } from "./client";

export interface CatalogFile {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  category: string | null;
  size_bytes: number | null;
  created_at: string;
}

export async function listCatalogFiles(): Promise<CatalogFile[]> {
  const { data, error } = await supabase
    .from("catalog_files")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CatalogFile[];
}
