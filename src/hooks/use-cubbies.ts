"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCubbies, fetchCubbyRentals } from "@/lib/api";

// Hook for fetching all cubbies
export function useCubbies() {
  return useQuery({
    queryKey: ["cubbies"],
    queryFn: fetchCubbies,
  });
}

// Hook for fetching cubby rentals, optionally filtered by seller ID
export function useCubbyRentals(sellerId?: string) {
  return useQuery({
    queryKey: ["cubbyRentals", sellerId],
    queryFn: () => fetchCubbyRentals(sellerId),
  });
}
