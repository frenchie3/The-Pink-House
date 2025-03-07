import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import InventoryTable from "@/components/inventory/inventory-table";

export default async function InventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch inventory items
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*")
    .order("date_added", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Items
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track all items in your inventory
              </p>
            </div>

            <Button className="bg-teal-600 hover:bg-teal-700">
              <PlusCircle className="mr-2 h-5 w-5" />
              Add New Item
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
                placeholder="Search by SKU, name, or location..."
                className="pl-10 w-full bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-shrink-0">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                defaultValue="all"
              >
                <option value="all">All Categories</option>
                <option value="clothing">Clothing</option>
                <option value="furniture">Furniture</option>
                <option value="electronics">Electronics</option>
                <option value="books">Books</option>
                <option value="toys">Toys</option>
                <option value="kitchenware">Kitchenware</option>
              </select>
              <select
                className="px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                defaultValue="in-stock"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <InventoryTable items={inventoryItems || []} />
          </div>
        </div>
      </main>
    </>
  );
}
