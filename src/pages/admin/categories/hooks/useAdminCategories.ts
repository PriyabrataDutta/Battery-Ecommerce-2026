import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryEditableFields,
} from "@/api/admin/categories";

export const ADMIN_CATEGORIES_KEY = ["admin", "categories"] as const;

export function useAdminCategoriesQuery(search?: string) {
  return useQuery({
    queryKey: [...ADMIN_CATEGORIES_KEY, { search }],
    queryFn: () => listAdminCategories(search),
    staleTime: 10_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryEditableFields) => createCategory(input),
    onSuccess: () => {
      toast.success("Category created");
      qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not create category"),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<CategoryEditableFields> }) =>
      updateCategory(id, patch),
    onSuccess: () => {
      toast.success("Category updated");
      qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update category"),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: ADMIN_CATEGORIES_KEY });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not delete category"),
  });
}
