import { useQuery } from "@tanstack/react-query";
import { ApiError, apiGet } from "@/lib/api";
import type { User } from "@/types";

/** Session probe: null when logged out (401), User otherwise. */
export function useMe() {
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await apiGet<User>("/auth/me");
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}
