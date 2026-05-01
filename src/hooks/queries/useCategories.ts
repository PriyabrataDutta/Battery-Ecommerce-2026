import { useQuery } from "@tanstack/react-query";
import * as api from "@/api/categories";
import { qk } from "./keys";

export const useCategories = () =>
  useQuery({
    queryKey: qk.categories.list(),
    queryFn: api.listCategories,
  });

export const useCategoryBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.categories.bySlug(slug),
    queryFn: () => api.getCategoryBySlug(slug!),
    enabled: !!slug,
  });
