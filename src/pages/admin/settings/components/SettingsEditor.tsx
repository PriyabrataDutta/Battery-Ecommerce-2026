import { useEffect, useMemo, useState } from "react";
import { EntityDrawer } from "@/components/admin/EntityDrawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettingRow } from "@/api/admin/settings";
import { useUpsertSetting, useDeleteSetting } from "../hooks/useAdminSettings";

/**
 * SettingsEditor
 * --------------------------------------------------------------
 * Edit any `site_settings` row. The value is stored as JSONB so
 * we let admins type raw JSON. We validate on save and only
 * commit if it parses.
 */
export function SettingsEditor({
  open,
  onOpenChange,
  setting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  setting: SiteSettingRow | null;
}) {
  const isEdit = !!setting;
  const [key, setKey] = useState("");
  const [valueText, setValueText] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (setting) {
      setKey(setting.key);
      setValueText(JSON.stringify(setting.value, null, 2));
    } else {
      setKey("");
      setValueText("{\n  \n}");
    }
    setError(null);
  }, [open, setting]);

  const upsert = useUpsertSetting();
  const remove = useDeleteSetting();
  const saving = upsert.isPending;

  const parsed = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(valueText) };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  }, [valueText]);

  const handleSave = async () => {
    if (!key.trim()) {
      setError("Key is required");
      return;
    }
    if (!parsed.ok) {
      setError(`Invalid JSON: ${parsed.error}`);
      return;
    }
    setError(null);
    await upsert.mutateAsync({ key: key.trim(), value: parsed.value });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!setting) return;
    await remove.mutateAsync(setting.key);
    onOpenChange(false);
  };

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit · ${setting?.key}` : "New setting"}
      description="Stored as JSONB. Use any valid JSON value (object, array, string, number…)."
      saveLabel={isEdit ? "Save changes" : "Create setting"}
      saving={saving}
      onSave={handleSave}
      onDelete={isEdit ? handleDelete : undefined}
      deleteLabel="Delete setting"
    >
      <div className="space-y-1">
        <Label className="text-xs">Key {!isEdit && <span className="text-destructive">*</span>}</Label>
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={isEdit}
          placeholder="e.g. shipping_threshold_inr"
          className="font-mono"
        />
        {isEdit && (
          <p className="text-[11px] text-muted-foreground">
            Keys can't be renamed — delete and recreate if needed.
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Value (JSON)</Label>
        <Textarea
          rows={10}
          value={valueText}
          onChange={(e) => setValueText(e.target.value)}
          className="font-mono text-xs"
          spellCheck={false}
        />
        {!parsed.ok && (
          <p className="text-[11px] text-destructive">Invalid JSON: {parsed.error}</p>
        )}
        {error && <p className="text-[11px] text-destructive">{error}</p>}
      </div>
    </EntityDrawer>
  );
}
