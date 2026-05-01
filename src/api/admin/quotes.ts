import { supabase } from "../client";
import { logActivity } from "@/lib/adminLog";

/**
 * Admin Quotes API
 * --------------------------------------------------------------
 * Read + status updates for the `quote_requests` table.
 * Customers submit via `src/api/quotes.ts`.
 */

export const REQUEST_STATUSES = ["new", "reviewed", "quoted", "in_progress", "closed"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface AdminQuoteRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  requirement: string;
  boq_file_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listAdminQuotes(
  opts: { search?: string; status?: string } = {},
): Promise<AdminQuoteRow[]> {
  let q = supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts.status) q = q.eq("status", opts.status as never);
  if (opts.search) {
    const like = `%${opts.search}%`;
    q = q.or(
      `name.ilike.${like},email.ilike.${like},phone.ilike.${like},company.ilike.${like}`,
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminQuoteRow[];
}

export async function setQuoteStatus(id: string, status: RequestStatus, prev: string) {
  const { error } = await supabase
    .from("quote_requests")
    .update({ status: status as never })
    .eq("id", id);
  if (error) throw error;
  await logActivity("quote.status_change", "quote", id, { from: prev, to: status });
}
