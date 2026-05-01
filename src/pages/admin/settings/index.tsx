import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SettingsTable } from "./components/SettingsTable";
import { SettingsEditor } from "./components/SettingsEditor";
import { useSettingsQuery } from "./hooks/useAdminSettings";
import type { SiteSettingRow } from "@/api/admin/settings";

/**
 * AdminSettings (orchestrator)
 * ==============================================================
 * Generic CRUD surface for the `site_settings` key/value table.
 * Every row is a JSONB value — handy for feature flags, copy
 * tweaks, runtime constants, etc.
 *
 * FILE MAP
 *   index.tsx                       ← this file (composition + search)
 *   components/SettingsTable.tsx    ← list view
 *   components/SettingsEditor.tsx   ← key + JSON value drawer
 *   hooks/useAdminSettings.ts       ← React Query hooks
 *
 * USAGE PATTERN
 *   The storefront reads via `getSetting('your_key')` from
 *   `src/api/settings.ts`. Add a typed wrapper there if you find
 *   yourself looking up the same key in many places.
 */
const AdminSettings = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SiteSettingRow | null>(null);
  const q = useSettingsQuery();

  const filtered = (q.data ?? []).filter((r) =>
    !search.trim() ? true : r.key.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <div className="bg-card border border-line rounded-lg p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings by key"
            className="pl-8 h-9 text-sm"
          />
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} settings</span>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          New setting
        </Button>
      </div>

      <SettingsTable
        rows={filtered}
        loading={q.isLoading}
        onRowClick={(s) => {
          setEditing(s);
          setOpen(true);
        }}
        onCreate={() => {
          setEditing(null);
          setOpen(true);
        }}
      />

      <SettingsEditor open={open} onOpenChange={setOpen} setting={editing} />
    </div>
  );
};

export default AdminSettings;
