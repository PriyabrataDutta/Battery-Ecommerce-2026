import { supabase } from "./client";

export interface NewContactMessageInput {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}

export async function submitContactMessage(input: NewContactMessageInput): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert(input);
  if (error) throw error;
}

export interface NewCallbackInput {
  name: string;
  phone: string;
  preferred_time: string | null;
  message: string | null;
}

export async function submitCallbackRequest(input: NewCallbackInput): Promise<void> {
  const { error } = await supabase.from("callback_requests").insert(input);
  if (error) throw error;
}
