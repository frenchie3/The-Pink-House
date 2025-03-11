"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../../../supabase/client";
import POSInterface from "./pos-interface";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface POSClientInterfaceProps {
  categories: Category[];
  userId: string;
}

export default function POSClientInterface({
  categories,
  userId,
}: POSClientInterfaceProps) {
  const supabase = createClient();

  // Fetch inventory items with React Query
  const {
    data: inventoryItems,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["posInventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select(
          "id, name, sku, price, quantity, category, description, cubby_location, barcode, image_url, seller_id, commission_rate",
        )
        .gt("quantity", 0)
        .order("date_added", { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-pink-200 rounded-xl blur-xl opacity-30 animate-pulse"></div>
            <LoadingSpinner size="xl" color="primary" />
          </div>
          <div>
            <p className="text-gray-700 font-medium">Loading Point of Sale</p>
            <p className="text-gray-500 text-sm">Preparing your inventory...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-600">
        <p>
          Error loading inventory:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <POSInterface
      inventoryItems={inventoryItems || []}
      categories={categories}
      userId={userId}
    />
  );
}
