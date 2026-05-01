import { useState } from "react";
import { ProductsToolbar, type ProductsFilterState } from "./components/ProductsToolbar";
import { ProductsTable } from "./components/ProductsTable";
import { ProductEditor } from "./components/ProductEditor";
import { BulkFitmentDialog } from "./components/BulkFitmentDialog";
import {
  useAdminProductsQuery,
  useBrandsQuery,
  useCategoriesQuery,
} from "./hooks/useAdminProducts";
import type { AdminProductRow } from "@/api/admin/products";

/**
 * AdminProducts (orchestrator)
 * ==============================================================
 * Catalog management surface in the Admin Dashboard.
 *
 * FILE MAP
 *   index.tsx                    ← you are here (state + composition)
 *   components/
 *     ProductsToolbar.tsx        ← search + filter row
 *     ProductsTable.tsx          ← list view (uses EntityTable)
 *     ProductEditor.tsx          ← create / edit drawer (uses EntityDrawer)
 *   hooks/
 *     useAdminProducts.ts        ← React Query hooks + mutations
 *   lib/
 *     constants.ts               ← EMPTY_PRODUCT + PRODUCT_STATUSES
 *
 * COMMON EDITS
 *   • Add a column to the list   → components/ProductsTable.tsx
 *   • Add a filter               → components/ProductsToolbar.tsx + ListAdminProductsOptions
 *   • Add an editable field      → ProductEditor.tsx + ProductEditableFields (api/admin/products.ts)
 *   • Add stricter validation    → introduce lib/validation.ts (Zod), call before mutation
 */
const AdminProducts = () => {
  const [filters, setFilters] = useState<ProductsFilterState>({
    search: "",
    status: "",
    brandId: "",
    categoryId: "",
    lowStockOnly: false,
  });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductRow | null>(null);

  const productsQuery = useAdminProductsQuery({
    search: filters.search || undefined,
    status: filters.status || undefined,
    brandId: filters.brandId || undefined,
    categoryId: filters.categoryId || undefined,
    lowStockOnly: filters.lowStockOnly,
  });
  const brandsQuery = useBrandsQuery();
  const categoriesQuery = useCategoriesQuery();

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (p: AdminProductRow) => {
    setEditing(p);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-3">
      <ProductsToolbar
        state={filters}
        onChange={setFilters}
        onCreate={openCreate}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        count={productsQuery.data?.length ?? 0}
      />
      <ProductsTable
        rows={productsQuery.data ?? []}
        loading={productsQuery.isLoading}
        onRowClick={openEdit}
        onCreate={openCreate}
      />
      <ProductEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        product={editing}
        brands={brandsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
      />
    </div>
  );
};

export default AdminProducts;
