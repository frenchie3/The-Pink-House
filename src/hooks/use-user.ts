"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "@/lib/api";

// Hook for fetching the current user's profile
export function useUserProfile() {
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: fetchUserProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
