import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Tag, Filter } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

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

  return (
    <SellerGuard>
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

            <Button className="bg-pink-600 hover:bg-pink-700" asChild>
              <a href="/dashboard/seller/listings/add">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New Item
              </a>
            </Button>
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
                className="pl-10 w-full bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-shrink-0">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                defaultValue="all"
              >
                <option value="all">All Categories</option>
                <option value="clothing">Clothing</option>
                <option value="furniture">Furniture</option>
                <option value="electronics">Electronics</option>
                <option value="jewelry">Jewelry</option>
                <option value="art">Art</option>
              </select>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                defaultValue="in-stock"
              >
                <option value="all">All Status</option>
                <option value="in-stock">In Stock</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {inventoryItems && inventoryItems.length > 0 ? (
              inventoryItems.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative h-48 bg-gray-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Tag className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
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
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <div className="flex justify-between items-center mt-1">
                      <div>
                        <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-pink-600 border-pink-200 hover:bg-pink-50"
                        asChild
                      >
                        <a href={`/dashboard/seller/listings/edit/${item.id}`}>
                          Edit
                        </a>
                      </Button>
                    </div>
                    {item.cubby_location && (
                      <p className="text-xs text-gray-500 mt-2">
                        Cubby: {item.cubby_location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">You don't have any listings yet</p>
                <Button className="mt-4 bg-pink-600 hover:bg-pink-700" asChild>
                  <a href="/dashboard/seller/listings/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Item
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </SellerGuard>
  );
}
