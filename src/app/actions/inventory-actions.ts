"use server";

import { createClient } from "../../../supabase/server";
import { revalidatePath } from "next/cache";

// Server action to update inventory item
export async function updateInventoryItem(formData: FormData) {
  const supabase = await createClient();

  const itemId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const condition = formData.get("condition") as string;

  try {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        name,
        price,
        category,
        description,
        quantity,
        condition,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/seller/listings");
    revalidatePath(`/dashboard/seller/listings/edit/${itemId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}

// Server action to add new inventory item
export async function addInventoryItem(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const condition = formData.get("condition") as string;
  const cubbyId = formData.get("cubby_id") as string;
  const listingType = formData.get("listing_type") as string;

  try {
    // Get the cubby details to set cubby_location
    const { data: cubbyData } = await supabase
      .from("cubbies")
      .select("cubby_number")
      .eq("id", cubbyId)
      .single();

    // Get commission rate from user's active rental
    const { data: rentalData } = await supabase
      .from("cubby_rentals")
      .select("commission_rate")
      .eq("seller_id", user.id)
      .eq("status", "active")
      .single();

    // Generate a unique SKU
    const timestamp = Date.now().toString().slice(-6);
    const sku = `${category.slice(0, 3).toUpperCase()}${timestamp}`;

    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        name,
        price,
        category,
        description,
        quantity,
        condition,
        seller_id: user.id,
        cubby_id: cubbyId,
        cubby_location: cubbyData?.cubby_number,
        sku,
        date_added: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        listing_type: listingType,
        commission_rate: rentalData?.commission_rate || 0.15,
        editing_locked: false,
        is_active: true,
      })
      .select();

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/seller/listings");

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error adding inventory item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item",
    };
  }
}

// Server action to update inventory item as staff/admin, bypassing editing_locked status
export async function updateInventoryItemAsStaff(formData: FormData) {
  const supabase = await createClient();

  // Check if user is staff or admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "User not authenticated" };
  }

  // Verify staff/admin role
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userError || !userData || !["staff", "admin"].includes(userData.role)) {
    return { success: false, error: "Unauthorized access" };
  }

  const itemId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const condition = formData.get("condition") as string;

  try {
    const { error } = await supabase
      .from("inventory_items")
      .update({
        name,
        price,
        category,
        description,
        quantity,
        condition,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId);

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/staff/cubby-management");
    revalidatePath(`/dashboard/staff/cubby-management/${itemId}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating inventory item as staff:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update item",
    };
  }
}
