import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_GROUPS, type PermissionKey } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Props {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PermissionsEditor({ userId, userName, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: currentPerms, isLoading } = useUserPermissions(open ? userId : undefined);
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Merge current perms with pending changes
  const effectivePerms = useMemo(() => {
    const set = new Set(currentPerms ?? []);
    for (const [key, val] of Object.entries(pendingChanges)) {
      if (val) set.add(key as PermissionKey);
      else set.delete(key as PermissionKey);
    }
    return set;
  }, [currentPerms, pendingChanges]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const toggle = (key: PermissionKey) => {
    const currentlyHas = currentPerms?.has(key) ?? false;
    const pendingVal = pendingChanges[key];
    const effectiveVal = pendingVal !== undefined ? pendingVal : currentlyHas;

    if (!effectiveVal === currentlyHas) {
      // Would return to original state — remove from pending
      const next = { ...pendingChanges };
      delete next[key];
      setPendingChanges(next);
    } else {
      setPendingChanges({ ...pendingChanges, [key]: !effectiveVal });
    }
  };

  const selectAll = () => {
    const changes: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((k) => {
      if (!currentPerms?.has(k)) changes[k] = true;
    });
    setPendingChanges(changes);
  };

  const clearAll = () => {
    const changes: Record<string, boolean> = {};
    (currentPerms ?? new Set()).forEach((k) => {
      changes[k] = false;
    });
    setPendingChanges(changes);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      for (const [key, val] of Object.entries(pendingChanges)) {
        if (val) toAdd.push(key);
        else toRemove.push(key);
      }

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("staff_permissions")
          .delete()
          .eq("user_id", userId)
          .in("permission", toRemove);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const rows = toAdd.map((p) => ({
          user_id: userId,
          permission: p,
          granted_by: user?.id ?? null,
        }));
        const { error } = await supabase
          .from("staff_permissions")
          .upsert(rows, { onConflict: "user_id,permission" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Permissions updated", { description: userName });
      setPendingChanges({});
      qc.invalidateQueries({ queryKey: ["user-permissions", userId] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Failed to update permissions"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setPendingChanges({}); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Permissions — {userName || "Staff Member"}
          </DialogTitle>
          <DialogDescription>
            Select which admin sections this staff member can access.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            Loading permissions…
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll} className="text-xs">
                Clear All
              </Button>
            </div>

            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  {group.label}
                </h4>
                <div className="space-y-1.5">
                  {group.keys.map((key) => {
                    const checked = effectivePerms.has(key);
                    return (
                      <label
                        key={key}
                        className="flex items-center gap-2.5 px-3 py-2 border border-line rounded-md cursor-pointer hover:border-primary/40 transition-colors"
                      >
                        <Checkbox checked={checked} onCheckedChange={() => toggle(key)} />
                        <span className="text-sm flex-1">{PERMISSION_LABELS[key]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2 border-t border-line">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!hasPendingChanges || saveMutation.isPending}
                className="flex-1"
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving…</>
                ) : (
                  "Save Permissions"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setPendingChanges({}); onOpenChange(false); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
