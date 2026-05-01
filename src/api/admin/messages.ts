import { supabase } from "../client";
import { logActivity } from "@/lib/adminLog";
import type { RequestStatus } from "./quotes";

/**
 * Admin Messages API
 * --------------------------------------------------------------
 * Read + triage for `contact_messages` and `callback_requests`.
 */

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface AdminCallbackRequest {
  id: string;
  name: string;
  phone: string;
  preferred_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listContactMessages(
  opts: { search?: string; status?: string } = {},
): Promise<AdminContactMessage[]> {
  let q = supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts.status) q = q.eq("status", opts.status as never);
  if (opts.search) {
    const like = `%${opts.search}%`;
    q = q.or(
      `name.ilike.${like},email.ilike.${like},subject.ilike.${like},message.ilike.${like}`,
    );
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminContactMessage[];
}

export async function listCallbackRequests(
  opts: { search?: string; status?: string } = {},
): Promise<AdminCallbackRequest[]> {
  let q = supabase
    .from("callback_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (opts.status) q = q.eq("status", opts.status as never);
  if (opts.search) {
    const like = `%${opts.search}%`;
    q = q.or(`name.ilike.${like},phone.ilike.${like},message.ilike.${like}`);
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AdminCallbackRequest[];
}

export async function setContactStatus(id: string, status: RequestStatus, prev: string) {
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: status as never })
    .eq("id", id);
  if (error) throw error;
  await logActivity("contact.status_change", "contact_message", id, { from: prev, to: status });
}

export async function setCallbackStatus(id: string, status: RequestStatus, prev: string) {
  const { error } = await supabase
    .from("callback_requests")
    .update({ status: status as never })
    .eq("id", id);
  if (error) throw error;
  await logActivity("callback.status_change", "callback_request", id, { from: prev, to: status });
}
