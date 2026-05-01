import { useState } from "react";
import { CategoriesToolbar } from "./components/CategoriesToolbar";
import { CategoriesTable } from "./components/CategoriesTable";
import { CategoryEditor } from "./components/CategoryEditor";
import { useAdminCategoriesQuery } from "./hooks/useAdminCategories";
import type { AdminCategoryRow } from "@/api/admin/categories";

/**
 * AdminCategories (orchestrator)
 * ==============================================================
 * CRUD surface for `categories`. See README.md for the file map.
 */
const AdminCategories = () => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategoryRow | null>(null);
  const q = useAdminCategoriesQuery(search || undefined);

  return (
    <div className="space-y-3">
      <CategoriesToolbar
        search={search}
        onSearch={setSearch}
        onCreate={() => {
          setEditing(null);
          setOpen(true);
        }}
        count={q.data?.length ?? 0}
      />
      <CategoriesTable
        rows={q.data ?? []}
        loading={q.isLoading}
        onRowClick={(c) => {
          setEditing(c);
          setOpen(true);
        }}
        onCreate={() => {
          setEditing(null);
          setOpen(true);
        }}
      />
      <CategoryEditor
        open={open}
        onOpenChange={setOpen}
        category={editing}
        allCategories={q.data ?? []}
      />
    </div>
  );
};

export default AdminCategories;
