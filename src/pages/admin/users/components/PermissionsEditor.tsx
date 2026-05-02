import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPermissions, ALL_PERMISSIONS, PERMISSION_LABELS, PERMISSION_GROUPS, type PermissionKey } from "@/hooks/usePermissions";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Loader2, Zap, Plus, Pencil, Trash2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* ── Built-in Preset Templates ── */
interface PermissionPreset {
  id?: string;
  label: string;
  description: string;
  keys: PermissionKey[];
  isBuiltIn?: boolean;
}

const BUILTIN_PRESETS: PermissionPreset[] = [
  {
    label: "Sales",
    description: "Orders, quotes, customers & dashboard",
    keys: ["dashboard.view", "orders.manage", "quotes.manage", "customers.view"],
    isBuiltIn: true,
  },
  {
    label: "Catalog Admin",
    description: "Products, brands, categories & fitment",
    keys: ["dashboard.view", "products.manage", "brands.manage", "categories.manage", "fitment.manage", "media.manage"],
    isBuiltIn: true,
  },
  {
    label: "Support",
    description: "Messages, callbacks, orders & customers",
    keys: ["dashboard.view", "orders.manage", "messages.manage", "customers.view", "quotes.manage"],
    isBuiltIn: true,
  },
  {
    label: "Full Access",
    description: "Everything except team management",
    keys: ALL_PERMISSIONS.filter((k) => k !== "users.manage") as PermissionKey[],
    isBuiltIn: true,
  },
];

/* ── Custom Presets Hook ── */
function useCustomPresets() {
  return useQuery({
    queryKey: ["permission-presets"],
    queryFn: async (): Promise<PermissionPreset[]> => {
      const { data, error } = await supabase
        .from("permission_presets")
        .select("id, label, description, keys")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        label: r.label,
        description: r.description ?? "",
        keys: (r.keys ?? []) as PermissionKey[],
        isBuiltIn: false,
      }));
    },
    staleTime: 60_000,
  });
}

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
  const { data: customPresets } = useCustomPresets();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  // Preset editor state
  const [editingPreset, setEditingPreset] = useState<{ id?: string; label: string; description: string } | null>(null);
  const [savingAsPreset, setSavingAsPreset] = useState(false);

  const allPresets = useMemo(
    () => [...BUILTIN_PRESETS, ...(customPresets ?? [])],
    [customPresets]
  );

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
      const next = { ...pendingChanges };
      delete next[key];
      setPendingChanges(next);
    } else {
      setPendingChanges({ ...pendingChanges, [key]: !effectiveVal });
    }
  };

  const applyPreset = (preset: PermissionPreset) => {
    const changes: Record<string, boolean> = {};
    (currentPerms ?? new Set()).forEach((k) => { changes[k] = false; });
    preset.keys.forEach((k) => {
      if (currentPerms?.has(k)) delete changes[k];
      else changes[k] = true;
    });
    setPendingChanges(changes);
    toast.info(`Applied "${preset.label}" preset`);
  };

  const selectAll = () => {
    const changes: Record<string, boolean> = {};
    ALL_PERMISSIONS.forEach((k) => { if (!currentPerms?.has(k)) changes[k] = true; });
    setPendingChanges(changes);
  };

  const clearAll = () => {
    const changes: Record<string, boolean> = {};
    (currentPerms ?? new Set()).forEach((k) => { changes[k] = false; });
    setPendingChanges(changes);
  };

  /* ── Save current selection as a new custom preset ── */
  const savePresetMutation = useMutation({
    mutationFn: async ({ id, label, description }: { id?: string; label: string; description: string }) => {
      const keys = Array.from(effectivePerms);
      if (keys.length === 0) throw new Error("Select at least one permission first");
      if (!label.trim()) throw new Error("Preset name is required");

      if (id) {
        const { error } = await supabase
          .from("permission_presets")
          .update({ label: label.trim(), description: description.trim() || null, keys })
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("permission_presets")
          .insert({ label: label.trim(), description: description.trim() || null, keys, created_by: user?.id ?? null });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      toast.success(vars.id ? "Preset updated" : "Preset saved", { description: vars.label });
      qc.invalidateQueries({ queryKey: ["permission-presets"] });
      setEditingPreset(null);
      setSavingAsPreset(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("permission_presets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Preset deleted");
      qc.invalidateQueries({ queryKey: ["permission-presets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ── Update an existing custom preset's keys to match current selection ── */
  const updatePresetKeysMutation = useMutation({
    mutationFn: async (preset: PermissionPreset) => {
      const keys = Array.from(effectivePerms);
      if (keys.length === 0) throw new Error("Select at least one permission first");
      const { error } = await supabase
        .from("permission_presets")
        .update({ keys })
        .eq("id", preset.id!);
      if (error) throw error;
    },
    onSuccess: (_, preset) => {
      toast.success("Preset permissions updated", { description: preset.label });
      qc.invalidateQueries({ queryKey: ["permission-presets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      for (const [key, val] of Object.entries(pendingChanges)) {
        if (val) toAdd.push(key);
        else toRemove.push(key);
      }

      if (toRemove.length > 0) {
        const { error } = await supabase.from("staff_permissions").delete().eq("user_id", userId).in("permission", toRemove);
        if (error) throw error;
      }
      if (toAdd.length > 0) {
        const rows = toAdd.map((p) => ({ user_id: userId, permission: p, granted_by: user?.id ?? null }));
        const { error } = await supabase.from("staff_permissions").upsert(rows, { onConflict: "user_id,permission" });
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
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPendingChanges({}); setEditingPreset(null); setSavingAsPreset(false); } onOpenChange(v); }}>
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
            {/* Preset Templates */}
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Quick Presets
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {allPresets.map((preset) => (
                  <div
                    key={preset.id ?? preset.label}
                    className="relative text-left border border-line rounded-lg p-2.5 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {preset.keys.length}
                        </Badge>
                        <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                          {preset.label}
                        </span>
                        {!preset.isBuiltIn && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 ml-auto">
                            Custom
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {preset.description}
                      </p>
                    </button>

                    {/* Edit / Delete for custom presets */}
                    {!preset.isBuiltIn && preset.id && (
                      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingPreset({ id: preset.id, label: preset.label, description: preset.description }); }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Rename preset"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updatePresetKeysMutation.mutate(preset);
                          }}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Update preset keys to current selection"
                        >
                          <Save className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); deletePresetMutation.mutate(preset.id!); }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          title="Delete preset"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Save as new preset / Edit existing preset name */}
              {(savingAsPreset || editingPreset) ? (
                <div className="mt-2 border border-primary/30 rounded-lg p-3 space-y-2 bg-primary/5">
                  <p className="text-xs font-semibold text-primary">
                    {editingPreset?.id ? "Edit Preset" : "Save Current Selection as Preset"}
                  </p>
                  <Input
                    placeholder="Preset name"
                    value={editingPreset?.label ?? ""}
                    onChange={(e) =>
                      setEditingPreset((prev) => prev ? { ...prev, label: e.target.value } : { label: e.target.value, description: "" })
                    }
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Short description (optional)"
                    value={editingPreset?.description ?? ""}
                    onChange={(e) =>
                      setEditingPreset((prev) => prev ? { ...prev, description: e.target.value } : { label: "", description: e.target.value })
                    }
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs"
                      disabled={!editingPreset?.label?.trim() || savePresetMutation.isPending}
                      onClick={() => {
                        if (editingPreset) savePresetMutation.mutate(editingPreset);
                      }}
                    >
                      {savePresetMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      {editingPreset?.id ? "Update" : "Save Preset"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs"
                      onClick={() => { setEditingPreset(null); setSavingAsPreset(false); }}
                    >
                      <X className="h-3 w-3 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs w-full"
                  onClick={() => { setSavingAsPreset(true); setEditingPreset({ label: "", description: "" }); }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Save Selection as Custom Preset
                </Button>
              )}
            </div>

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
