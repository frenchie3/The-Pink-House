"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchSellerEarnings } from "@/lib/api";

// Hook for fetching seller earnings with pagination
export function useSellerEarnings(
  sellerId: string,
  options?: { limit?: number; page?: number },
) {
  return useQuery({
    queryKey: [
      "sellerEarnings",
      sellerId,
      options?.page || 1,
      options?.limit || 20,
    ],
    queryFn: () => fetchSellerEarnings(sellerId, options),
    enabled: !!sellerId,
  });
}
