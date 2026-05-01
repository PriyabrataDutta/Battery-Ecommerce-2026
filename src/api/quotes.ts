import { supabase } from "./client";

export interface NewQuoteInput {
  name: string;
  email: string;
  phone: string;
  company: string | null;
  requirement: string;
  boq_file_url: string | null;
}

export async function submitQuoteRequest(input: NewQuoteInput): Promise<void> {
  const { error } = await supabase.from("quote_requests").insert(input);
  if (error) throw error;
}
