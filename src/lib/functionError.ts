/** The `{ error | message }` an edge function returned, instead of supabase-js's generic "non-2xx" text. */
export async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const ctx = (error as { context?: Response })?.context;
  const body = ctx && typeof ctx.json === "function" ? await ctx.json().catch(() => null) : null;
  return body?.message ?? body?.error ?? fallback;
}
