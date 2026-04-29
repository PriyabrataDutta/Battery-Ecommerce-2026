import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/lib/adminLog";

export function StatusPicker({
  value,
  options,
  table,
  id,
  invalidate,
  entityType,
}: {
  value: string;
  options: string[];
  table: "orders" | "quote_requests" | "callback_requests" | "contact_messages";
  id: string;
  invalidate: any[];
  entityType: string;
}) {
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.from(table).update({ status: next as any }).eq("id", id);
      if (error) throw error;
      await logActivity(`${entityType}.status_change`, entityType, id, { from: value, to: next });
    },
    onSuccess: () => {
      toast.success("Status updated");
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to update"),
  });

  return (
    <Select value={value} onValueChange={(v) => m.mutate(v)} disabled={m.isPending}>
      <SelectTrigger className="h-8 w-[140px] text-xs" onClick={(e) => e.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="text-xs capitalize">
            {o.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
