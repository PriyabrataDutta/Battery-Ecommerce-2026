import { useQuery } from "@tanstack/react-query";
import * as battery from "@/api/batteryBrands";
import * as cars from "@/api/carBrands";
import * as models from "@/api/carModels";
import { qk } from "./keys";

// ---------- Battery brands ----------

export const useBatteryBrands = () =>
  useQuery({
    queryKey: qk.batteryBrands.list(),
    queryFn: battery.listBatteryBrands,
  });

export const useBatteryBrandBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.batteryBrands.bySlug(slug),
    queryFn: () => battery.getBatteryBrandBySlug(slug!),
    enabled: !!slug,
  });

export const useBatteryBrandNameBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.batteryBrands.nameBySlug(slug),
    queryFn: () => battery.getBatteryBrandNameBySlug(slug!),
    enabled: !!slug,
  });

export const useResolveBatteryBrandSlugByName = (term: string) =>
  useQuery({
    queryKey: qk.batteryBrands.resolveByName(term),
    queryFn: () => battery.resolveBrandSlugByName(term),
    enabled: !!term,
  });

export const useCarBrandIdsBySlugs = (slugs: string[]) =>
  useQuery({
    queryKey: qk.carBrands.idsBySlugs(slugs),
    queryFn: () => cars.getCarBrandIdsBySlugs(slugs),
    enabled: slugs.length > 0,
  });

export const useCarModelIdsByBrandIds = (brandIds: string[] | undefined) =>
  useQuery({
    queryKey: qk.carModels.idsByBrandIds(brandIds),
    queryFn: () => models.getCarModelIdsByBrandIds(brandIds ?? []),
    enabled: !!brandIds && brandIds.length > 0,
  });

export const useResolveCarModelIdByName = (term: string) =>
  useQuery({
    queryKey: qk.carModels.resolveByName(term),
    queryFn: () => models.resolveCarModelIdByName(term),
    enabled: !!term,
  });

export const useCarModelIdBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.carModels.idBySlug(slug),
    queryFn: () => models.getCarModelIdBySlug(slug!),
    enabled: !!slug,
  });

// ---------- Car brands ----------

export const useCarBrands = () =>
  useQuery({
    queryKey: qk.carBrands.list(),
    queryFn: cars.listCarBrands,
  });

export const useCarBrandIdBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.carBrands.idBySlug(slug),
    queryFn: () => cars.getCarBrandIdBySlug(slug!),
    enabled: !!slug,
  });

export const useCarBrandNameBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.carBrands.nameBySlug(slug),
    queryFn: () => cars.getCarBrandNameBySlug(slug!),
    enabled: !!slug,
  });

export const useCarBrandNameMap = (slugs: string[]) =>
  useQuery({
    queryKey: qk.carBrands.nameMap(slugs),
    queryFn: () => cars.getCarBrandNameMap(slugs),
    enabled: slugs.length > 0,
  });

// ---------- Car models ----------

export const useCarModelsByBrandId = (brandId: string | null | undefined) =>
  useQuery({
    queryKey: qk.carModels.byBrandId(brandId ?? undefined),
    queryFn: () => models.listCarModelsByBrandId(brandId!),
    enabled: !!brandId,
  });

export const useCarModelNameBySlug = (slug: string | undefined) =>
  useQuery({
    queryKey: qk.carModels.nameBySlug(slug),
    queryFn: () => models.getCarModelNameBySlug(slug!),
    enabled: !!slug,
  });
