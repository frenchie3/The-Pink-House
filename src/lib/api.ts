import { createClient } from "../../supabase/client";

// Create a singleton instance of the Supabase client
const supabase = createClient();

// Inventory API functions
export async function fetchInventoryItems(options?: {
  limit?: number;
  page?: number;
}) {
  const { limit = 20, page = 1 } = options || {};
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error, count } = await supabase
    .from("inventory_items")
    .select(
      "id, name, sku, price, quantity, category, condition, location, cubby_location, date_added, image_url, barcode, description",
      { count: "exact" },
    )
    .order("date_added", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching inventory items:", error);
    throw new Error(error.message);
  }

  return { data, count };
}

export async function fetchInventoryItem(id: string) {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching inventory item ${id}:`, error);
    throw new Error(error.message);
  }

  return data;
}

// Categories API functions
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, description")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    throw new Error(error.message);
  }

  return data;
}

// Cubby API functions
export async function fetchCubbies() {
  const { data, error } = await supabase
    .from("cubbies")
    .select("id, cubby_number, location, status, updated_at")
    .order("cubby_number", { ascending: true });

  if (error) {
    console.error("Error fetching cubbies:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function fetchCubbyRentals(sellerId?: string) {
  let query = supabase
    .from("cubby_rentals")
    .select(
      "id, cubby_id, seller_id, start_date, end_date, status, payment_status, rental_fee, listing_type, commission_rate, cubby:cubbies(id, cubby_number, location)",
    )
    .order("end_date", { ascending: true });

  if (sellerId) {
    query = query.eq("seller_id", sellerId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching cubby rentals:", error);
    throw new Error(error.message);
  }

  return data;
}

// User API functions
export async function fetchUserProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Error fetching user:", authError);
    throw new Error(authError?.message || "User not authenticated");
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    throw new Error(error.message);
  }

  return data;
}

// Seller earnings API functions
export async function fetchSellerEarnings(
  sellerId: string,
  options?: { limit?: number; page?: number },
) {
  const { limit = 20, page = 1 } = options || {};
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  const { data, error, count } = await supabase
    .from("seller_earnings")
    .select(
      "id, gross_amount, commission_amount, net_amount, created_at, payout_id, sale_item_id, sale_item:sale_items(inventory_item:inventory_items(name, sku))",
      { count: "exact" },
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .range(start, end);

  if (error) {
    console.error("Error fetching seller earnings:", error);
    throw new Error(error.message);
  }

  return { data, count };
}

// Sales API functions
export async function createSale(saleData: any) {
  const { data, error } = await supabase
    .from("sales")
    .insert(saleData)
    .select();

  if (error) {
    console.error("Error creating sale:", error);
    throw new Error(error.message);
  }

  return data[0];
}

export async function createSaleItems(saleItems: any[]) {
  const { data, error } = await supabase.from("sale_items").insert(saleItems);

  if (error) {
    console.error("Error creating sale items:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateInventoryQuantity(
  itemId: string,
  newQuantity: number,
) {
  const { data, error } = await supabase
    .from("inventory_items")
    .update({ quantity: newQuantity })
    .eq("id", itemId);

  if (error) {
    console.error("Error updating inventory quantity:", error);
    throw new Error(error.message);
  }

  return data;
}
