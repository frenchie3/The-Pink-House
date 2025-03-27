import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tag, Search, Plus, Filter, LockIcon } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default async function SellerListingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch seller's inventory items with optimized fields selection
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select(
      "id, name, sku, price, quantity, category, description, date_added, cubby_location, editing_locked",
    )
    .eq("seller_id", user.id)
    .order("date_added", { ascending: false });

  // Fetch seller's active cubby rental with only needed fields
  const { data: activeCubby } = await supabase
    .from("cubby_rentals")
    .select(
      "id, cubby_id, listing_type, commission_rate, cubby:cubbies(cubby_number, location)",
    )
    .eq("seller_id", user.id)
    .eq("status", "active")
    .single();

  // Fetch categories for filtering
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Listings
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your items for sale in the shop
          </p>
        </div>

        {activeCubby ? (
          <Button className="bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/dashboard/seller/listings/add">
              <Plus className="mr-2 h-5 w-5" />
              Add New Item
            </Link>
          </Button>
        ) : (
          <Button className="bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/dashboard/seller/cubby">
              <Plus className="mr-2 h-5 w-5" />
              Rent a Cubby
            </Link>
          </Button>
        )}
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="search"
            placeholder="Search your listings..."
            className="pl-10 w-full"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <select className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent">
            <option value="">All Categories</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Your Items</CardTitle>
        </CardHeader>
        <CardContent>
          {!activeCubby ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">
                You need to rent a cubby before adding items
              </p>
              <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                <Link href="/dashboard/seller/cubby">
                  Rent a Cubby Now
                </Link>
              </Button>
            </div>
          ) : inventoryItems && inventoryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventoryItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="bg-gray-50 p-5">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 truncate max-w-[70%]">
                        {item.name}
                      </h3>
                      <span className="text-lg font-bold text-pink-600">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-sm text-gray-500">
                        Qty: {item.quantity}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.quantity > 0 ? "In Stock" : "Sold Out"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {!item.editing_locked ? (
                        <span className="text-xs text-amber-600 flex items-center gap-1.5">
                          Editable until labels are printed
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 flex items-center gap-1.5">
                          <LockIcon className="h-3 w-3" />
                          Labels printed - editing locked
                        </span>
                      )}

                      <div className="ml-auto">
                        {!item.editing_locked && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-full"
                          >
                            <Link
                              href={`/dashboard/seller/listings/edit/${item.id}`}
                            >
                              Edit
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-4">
                You don't have any items listed yet
              </p>
              <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                <Link href="/dashboard/seller/listings/add">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Item
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
