/**
 * Single import point for the database client.
 *
 * Every file in `src/api/` imports the client from here.
 * Components, pages and hooks must NOT import the underlying client directly —
 * if you need backend access, add (or use) a function in this folder instead.
 *
 * When you swap to a custom backend later, you only edit the files in
 * `src/api/` — the rest of the app stays untouched.
 */
export { supabase } from "@/integrations/supabase/client";
