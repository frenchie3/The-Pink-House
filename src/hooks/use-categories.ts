"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api";

// Hook for fetching categories
export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes - categories don't change often
  });
}
