"use server";

import { createClient } from "../../../supabase/server";
import { revalidatePath } from "next/cache";

// Server action to process a sale
export async function processSale(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const cartItems = JSON.parse(formData.get("cartItems") as string);
  const cartTotal = parseFloat(formData.get("cartTotal") as string);
  const paymentMethod = formData.get("paymentMethod") as string;

  try {
    // 1. Create sale record
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        sale_date: new Date().toISOString(),
        total_amount: cartTotal,
        payment_method: paymentMethod,
        created_by: user.id,
      })
      .select();

    if (saleError || !sale || sale.length === 0) {
      throw new Error(saleError?.message || "Failed to create sale record");
    }

    const saleId = sale[0].id;

    // 2. Create sale items
    const saleItems = cartItems.map((item: any) => ({
      sale_id: saleId,
      inventory_item_id: item.id,
      quantity: item.cartQuantity,
      price_sold: item.price,
    }));

    const { error: saleItemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (saleItemsError) {
      throw new Error(saleItemsError.message);
    }

    // 3. Update inventory quantities
    for (const item of cartItems) {
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ quantity: item.quantity - item.cartQuantity })
        .eq("id", item.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    // 4. Create seller earnings records
    for (const item of cartItems) {
      if (item.seller_id) {
        const grossAmount = item.price * item.cartQuantity;
        const commissionRate = item.commission_rate || 0.15;
        const commissionAmount = grossAmount * commissionRate;
        const netAmount = grossAmount - commissionAmount;

        const { error: earningsError } = await supabase
          .from("seller_earnings")
          .insert({
            seller_id: item.seller_id,
            sale_item_id: saleItems[cartItems.indexOf(item)].id,
            gross_amount: grossAmount,
            commission_amount: commissionAmount,
            net_amount: netAmount,
            created_at: new Date().toISOString(),
          });

        if (earningsError) {
          console.error("Error creating seller earnings:", earningsError);
          // Continue processing other items even if one fails
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/sales");

    return { success: true, saleId };
  } catch (error) {
    console.error("Error processing sale:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process sale",
    };
  }
}
