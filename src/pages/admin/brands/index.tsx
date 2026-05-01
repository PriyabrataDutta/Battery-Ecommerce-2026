import { useState } from "react";
import { BrandsToolbar } from "./components/BrandsToolbar";
import { BrandsTable } from "./components/BrandsTable";
import { BrandEditor } from "./components/BrandEditor";
import { useAdminBrandsQuery } from "./hooks/useAdminBrands";
import type { AdminBrandRow } from "@/api/admin/brands";

/**
 * AdminBrands (orchestrator)
 * ==============================================================
 * CRUD surface for `battery_brands`.
 *
 * FILE MAP
 *   index.tsx                ← composition + state (open/close, selection)
 *   components/
 *     BrandsToolbar.tsx      ← search + new brand button
 *     BrandsTable.tsx        ← list view
 *     BrandEditor.tsx        ← create / edit drawer
 *   hooks/useAdminBrands.ts  ← React Query hooks
 *
 * COMMON EDITS
 *   • Add a column           → BrandsTable.tsx
 *   • Add an editable field  → BrandEditor.tsx + BrandEditableFields
 *                              (api/admin/brands.ts)
 *   • Add server-side filter → useAdminBrandsQuery + listAdminBrands
 */
const AdminBrands = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminBrandRow | null>(null);
  const q = useAdminBrandsQuery(search || undefined);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (b: AdminBrandRow) => {
    setEditing(b);
    setOpen(true);
  };

  return (
    <div className="space-y-3">
      <BrandsToolbar
        search={search}
        onSearch={setSearch}
        onCreate={openCreate}
        count={q.data?.length ?? 0}
      />
      <BrandsTable
        rows={q.data ?? []}
        loading={q.isLoading}
        onRowClick={openEdit}
        onCreate={openCreate}
      />
      <BrandEditor open={open} onOpenChange={setOpen} brand={editing} />
    </div>
  );
};

export default AdminBrands;
