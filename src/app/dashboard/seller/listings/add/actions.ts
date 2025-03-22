"use server";

import { createClient } from "../../../../../../supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addItemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return encodedRedirect(
      "error",
      "/dashboard/seller/listings/add",
      "You must be logged in",
    );
  }

  // Get form data
  const name = formData.get("name") as string;
  const price = parseFloat(formData.get("price") as string);
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const quantity = parseInt(formData.get("quantity") as string);
  const condition = formData.get("condition") as string;
  const listingType = (formData.get("listing_type") as string) || "self";
  const cubbyId = formData.get("cubby_id") as string;
  const cubbyNumber = formData.get("cubby_number") as string;

  // Validate required fields
  if (!name || !price || !category || !quantity || !cubbyId) {
    return encodedRedirect(
      "error",
      "/dashboard/seller/listings/add",
      "Please fill in all required fields",
    );
  }

  // Generate a SKU
  const sku = `${user.id.substring(0, 4)}-${Date.now().toString().substring(9)}-${Math.floor(
    Math.random() * 1000,
  )
    .toString()
    .padStart(3, "0")}`;

  // Get the listing type from the active cubby rental
  const { data: cubbyRental, error: cubbyError } = await supabase
    .from("cubby_rentals")
    .select("listing_type, commission_rate")
    .eq("cubby_id", cubbyId)
    .eq("seller_id", user.id)
    .eq("status", "active")
    .single();

  if (cubbyError) {
    console.error("Error fetching cubby rental details:", cubbyError);
    return encodedRedirect(
      "error",
      "/dashboard/seller/listings/add",
      `Error fetching cubby details: ${cubbyError.message}`,
    );
  }

  // Insert the item
  const { error } = await supabase.from("inventory_items").insert({
    name,
    price,
    category,
    description,
    quantity,
    condition,
    sku,
    seller_id: user.id,
    cubby_id: cubbyId,
    cubby_location: cubbyNumber,
    date_added: new Date().toISOString(),
    is_active: true,
    listing_type: cubbyRental.listing_type || "self",
    commission_rate: cubbyRental.commission_rate || 0.15,
  });

  if (error) {
    console.error("Error adding item:", error);
    return encodedRedirect(
      "error",
      "/dashboard/seller/listings/add",
      `Error adding item: ${error.message}`,
    );
  }

  // Revalidate the listings page to show the new item
  revalidatePath("/dashboard/seller/listings");

  // This function doesn't need to return anything as we're handling the redirect client-side
  // for better UX, but we'll return a success message just in case
  return { success: true };
}
