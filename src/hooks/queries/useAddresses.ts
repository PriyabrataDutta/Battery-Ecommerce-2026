import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/addresses";
import { qk } from "./keys";

export const useMyAddresses = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.addresses.mine(userId),
    queryFn: () => api.listMyAddresses(userId!),
    enabled: !!userId,
  });

export const useDefaultAddress = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.addresses.default(userId),
    queryFn: () => api.getDefaultAddress(userId!),
    enabled: !!userId,
  });

export const useCreateAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createAddress,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
};

export const useSetDefaultAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.setAddressAsDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
};

export const useDeleteAddress = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.addresses.all }),
  });
};
