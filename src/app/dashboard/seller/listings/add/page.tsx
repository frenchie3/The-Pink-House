import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { encodedRedirect } from "@/utils/utils";
import { revalidatePath } from "next/cache";

export default async function AddListingPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch seller's active cubby rental
  const { data: activeCubby } = await supabase
    .from("cubby_rentals")
    .select("*, cubby:cubbies(*)")
    .eq("seller_id", user.id)
    .eq("status", "active")
    .single();

  // Fetch seller's current inventory count
  const { count: currentItemCount } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", user.id);

  // Fetch system settings for item limits
  const { data: itemLimitSetting } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "cubby_item_limits")
    .single();

  // Get user's plan (default to 'default' if not set)
  const { data: userData } = await supabase
    .from("users")
    .select("subscription")
    .eq("id", user.id)
    .single();

  const userPlan = userData?.subscription || "default";
  const itemLimit = itemLimitSetting?.setting_value?.[userPlan] || 10; // Default to 10 if setting not found
  const remainingItems = itemLimit - (currentItemCount || 0);

  // Fetch categories for dropdown
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  // Handle form submission
  async function addItem(formData: FormData) {
    "use server";

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

    // Check if user has an active cubby
    const { data: activeCubby } = await supabase
      .from("cubby_rentals")
      .select("*, cubby:cubbies(*)")
      .eq("seller_id", user.id)
      .eq("status", "active")
      .single();

    if (!activeCubby) {
      return encodedRedirect(
        "error",
        "/dashboard/seller/listings/add",
        "You need an active cubby to add items",
      );
    }

    // Check item limit
    const { count: currentItemCount } = await supabase
      .from("inventory_items")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id);

    const { data: itemLimitSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "cubby_item_limits")
      .single();

    const { data: userData } = await supabase
      .from("users")
      .select("subscription")
      .eq("id", user.id)
      .single();

    const userPlan = userData?.subscription || "default";
    const itemLimit = itemLimitSetting?.setting_value?.[userPlan] || 10;

    if ((currentItemCount || 0) >= itemLimit) {
      return encodedRedirect(
        "error",
        "/dashboard/seller/listings/add",
        `You've reached your limit of ${itemLimit} items`,
      );
    }

    // Get form data
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const condition = formData.get("condition") as string;

    // Validate required fields
    if (!name || !price || !category || !quantity) {
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
      cubby_id: activeCubby.cubby_id,
      cubby_location: activeCubby.cubby?.cubby_number,
      date_added: new Date().toISOString(),
      is_active: true,
      listing_type: "seller",
    });

    if (error) {
      console.error("Error adding item:", error);
      return encodedRedirect(
        "error",
        "/dashboard/seller/listings/add",
        `Error adding item: ${error.message}`,
      );
    }

    revalidatePath("/dashboard/seller/listings");
    // Redirect to success page with item details
    return redirect(
      `/dashboard/seller/listings/add/success?item_id=${rental[0].id}&name=${encodeURIComponent(name)}&type=${listingType}`,
    );
  }

  return (
    <SellerGuard>
      <SellerNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Item</h1>
              <p className="text-gray-600 mt-1">Add a new item to your cubby</p>
            </div>
          </header>

          {!activeCubby ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  You need an active cubby rental to add items
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <a href="/dashboard/seller/cubby">Rent a Cubby</a>
                </Button>
              </CardContent>
            </Card>
          ) : remainingItems <= 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  You've reached your limit of {itemLimit} items
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <a href="/dashboard/seller/listings">View Your Listings</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <p className="text-sm text-gray-500">
                  You can add {remainingItems} more item
                  {remainingItems !== 1 ? "s" : ""} to your cubby
                </p>
              </CardHeader>
              <CardContent>
                {searchParams.error && (
                  <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                    {searchParams.error}
                  </div>
                )}
                {searchParams.success && (
                  <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                    {searchParams.success}
                  </div>
                )}

                <form action={addItem} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Vintage Teacup Set"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Price (£) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="15.99"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        name="category"
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories?.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        defaultValue="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition</Label>
                      <select
                        id="condition"
                        name="condition"
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="listing_type">Listing Type</Label>
                      <select
                        id="listing_type"
                        name="listing_type"
                        className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      >
                        <option value="self">
                          Self-Listing (15% commission)
                        </option>
                        <option value="staff">
                          Staff-Managed (25% commission)
                        </option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Self-listing: You manage the item details and photos.
                        <br />
                        Staff-managed: Our staff will handle the listing process
                        for you.
                      </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe your item..."
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                      <a href="/dashboard/seller/listings">Cancel</a>
                    </Button>
                    <Button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      Add Item
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </SellerGuard>
  );
}
