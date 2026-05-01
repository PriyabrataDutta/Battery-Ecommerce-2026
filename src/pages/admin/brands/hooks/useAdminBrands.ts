import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listAdminBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  type BrandEditableFields,
} from "@/api/admin/brands";

export const ADMIN_BRANDS_KEY = ["admin", "brands"] as const;

export function useAdminBrandsQuery(search?: string) {
  return useQuery({
    queryKey: [...ADMIN_BRANDS_KEY, { search }],
    queryFn: () => listAdminBrands(search),
    staleTime: 10_000,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BrandEditableFields) => createBrand(input),
    onSuccess: () => {
      toast.success("Brand created");
      qc.invalidateQueries({ queryKey: ADMIN_BRANDS_KEY });
      qc.invalidateQueries({ queryKey: ["battery-brands"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not create brand"),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<BrandEditableFields> }) =>
      updateBrand(id, patch),
    onSuccess: () => {
      toast.success("Brand updated");
      qc.invalidateQueries({ queryKey: ADMIN_BRANDS_KEY });
      qc.invalidateQueries({ queryKey: ["battery-brands"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not update brand"),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      toast.success("Brand deleted");
      qc.invalidateQueries({ queryKey: ADMIN_BRANDS_KEY });
      qc.invalidateQueries({ queryKey: ["battery-brands"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Could not delete brand"),
  });
}
