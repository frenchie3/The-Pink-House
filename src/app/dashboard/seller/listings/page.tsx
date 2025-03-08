import SellerNavbar from "@/components/seller-navbar";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tag, Search, Plus, Filter } from "lucide-react";
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

  // Fetch seller's inventory items
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("seller_id", user.id)
    .order("date_added", { ascending: false });

  // Fetch seller's active cubby rental
  const { data: activeCubby } = await supabase
    .from("cubby_rentals")
    .select("*, cubby:cubbies(*)")
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
      <SellerNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
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
                    <Link href="/dashboard/seller/cubby">Rent a Cubby Now</Link>
                  </Button>
                </div>
              ) : inventoryItems && inventoryItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Item
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          SKU
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Price
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Quantity
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{item.name}</td>
                          <td className="py-3 px-4">{item.sku}</td>
                          <td className="py-3 px-4">
                            {formatPrice(item.price)}
                          </td>
                          <td className="py-3 px-4">{item.quantity}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.quantity > 0
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.quantity > 0 ? "In Stock" : "Sold Out"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" asChild>
                                <Link
                                  href={`/dashboard/seller/listings/edit/${item.id}`}
                                >
                                  Edit
                                </Link>
                              </Button>
                              {item.listing_type === "self" &&
                                !item.staff_reviewed && (
                                  <span className="text-xs text-amber-600 flex items-center">
                                    Editable until staff review
                                  </span>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
        </div>
      </main>
    </>
  );
}
