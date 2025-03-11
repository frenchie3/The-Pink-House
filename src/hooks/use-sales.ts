"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "../../supabase/client";

interface CartItem {
  id: string;
  cartQuantity: number;
  price: number;
  quantity: number;
  seller_id?: string;
  commission_rate?: number;
}

interface ProcessSaleParams {
  cartItems: CartItem[];
  cartTotal: number;
  paymentMethod: string;
  userId: string;
}

// Hook for processing a sale
export function useProcessSale() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async ({
      cartItems,
      cartTotal,
      paymentMethod,
      userId,
    }: ProcessSaleParams) => {
      // Create form data to submit to server action
      const formData = new FormData();
      formData.append("cartItems", JSON.stringify(cartItems));
      formData.append("cartTotal", cartTotal.toString());
      formData.append("paymentMethod", paymentMethod);

      // Submit to server action via API route
      const response = await fetch("/api/process-sale", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to process sale");
      }

      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["posInventory"] });
    },
  });
}
