"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchInventoryItems,
  fetchInventoryItem,
  updateInventoryQuantity,
} from "@/lib/api";

// Hook for fetching inventory items with pagination
export function useInventoryItems(options?: { limit?: number; page?: number }) {
  return useQuery({
    queryKey: ["inventory", options?.page || 1, options?.limit || 20],
    queryFn: () => fetchInventoryItems(options),
  });
}

// Hook for fetching a single inventory item
export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory", id],
    queryFn: () => fetchInventoryItem(id),
    enabled: !!id,
  });
}

// Hook for updating inventory quantity
export function useUpdateInventoryQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      newQuantity,
    }: {
      itemId: string;
      newQuantity: number;
    }) => updateInventoryQuantity(itemId, newQuantity),
    onSuccess: () => {
      // Invalidate inventory queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
