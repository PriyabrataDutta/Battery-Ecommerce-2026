import { useQuery } from "@tanstack/react-query";

/**
 * Whether Google sign-in is switched on in Supabase (Authentication → Providers),
 * read from the public Auth settings endpoint — so the button appears by itself
 * once the provider is configured.
 */
export function useGoogleEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ["auth-settings"],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      return res.ok ? ((await res.json()) as { external?: Record<string, boolean> }) : null;
    },
    staleTime: 10 * 60_000,
  });
  return data?.external?.google === true;
}
