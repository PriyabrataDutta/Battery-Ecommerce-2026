import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listSettings, upsertSetting, deleteSetting } from "@/api/admin/settings";

export const ADMIN_SETTINGS_KEY = ["admin", "site-settings"] as const;

export function useSettingsQuery() {
  return useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: listSettings,
    staleTime: 10_000,
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => upsertSetting(key, value),
    onSuccess: () => {
      toast.success("Setting saved");
      qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not save setting"),
  });
}

export function useDeleteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => deleteSetting(key),
    onSuccess: () => {
      toast.success("Setting deleted");
      qc.invalidateQueries({ queryKey: ADMIN_SETTINGS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not delete setting"),
  });
}
