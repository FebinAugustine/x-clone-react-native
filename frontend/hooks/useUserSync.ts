// hooks/useUserSync.ts (Updated)

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-expo";
import { useApiClient, userApi } from "../utils/api";

export const useUserSync = (isEnabled: boolean) => {
  const api = useApiClient();
  const [isSynced, setIsSynced] = useState(false);

  const syncUserMutation = useMutation({
    mutationFn: () => userApi.syncUser(api),
    onSuccess: () => {
      console.log("User synced successfully.");
      setIsSynced(true);
    },
    onError: (error) => {
      console.error("User sync failed:", error);
      setIsSynced(false);
    },
  });

  useEffect(() => {
    if (isEnabled && !isSynced) {
      syncUserMutation.mutate();
    }
  }, [isEnabled, isSynced]);

  return { isSynced };
};
