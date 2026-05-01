import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ListAdminProductsOptions,
  type ProductEditableFields,
} from "@/api/admin/products";
import { listBatteryBrands } from "@/api/batteryBrands";
import { listCategories } from "@/api/categories";

/**
 * React Query hooks for the admin Products panel.
 *
 * - `useAdminProductsQuery` — paginated/filterable list
 * - `useBrandsQuery` / `useCategoriesQuery` — for the editor selects
 * - `useCreate/Update/DeleteProduct` — mutations that auto-invalidate
 *   the list and surface toasts.
 */
export const ADMIN_PRODUCTS_KEY = ["admin", "products"] as const;

export function useAdminProductsQuery(opts: ListAdminProductsOptions) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, opts],
    queryFn: () => listAdminProducts(opts),
    staleTime: 10_000,
  });
}

export function useBrandsQuery() {
  return useQuery({ queryKey: ["battery-brands"], queryFn: listBatteryBrands, staleTime: 60_000 });
}

export function useCategoriesQuery() {
  return useQuery({ queryKey: ["categories"], queryFn: listCategories, staleTime: 60_000 });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductEditableFields) => createProduct(input),
    onSuccess: () => {
      toast.success("Product created");
      qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not create product"),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProductEditableFields> }) =>
      updateProduct(id, patch),
    onSuccess: () => {
      toast.success("Product updated");
      qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update product"),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      qc.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not delete product"),
  });
}
