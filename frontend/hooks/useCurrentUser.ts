// hooks/useCurrentUser.ts (Updated)

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient, userApi } from "../utils/api";

export const useCurrentUser = (isEnabled: boolean) => {
  const api = useApiClient();

  const {
    data: currentUser,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => userApi.getCurrentUser(api),
    select: (response) => response.data.user,
    enabled: isEnabled,
  });

  return { currentUser, isLoading, error, refetch };
};
