import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/api/profile";
import { qk } from "./keys";

export const useMyProfile = (userId: string | undefined) =>
  useQuery({
    queryKey: qk.profile.mine(userId),
    queryFn: () => api.getMyProfile(userId!),
    enabled: !!userId,
  });

export const useUpdateMyProfile = (userId: string | undefined) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: api.ProfileFields) => api.updateMyProfile(userId!, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile.mine(userId) }),
  });
};
