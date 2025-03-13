import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import InventorySearchFilters from "@/components/inventory/inventory-search-filters";
import InventoryClientTable from "@/components/inventory/inventory-client-table";

export default async function InventoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <>
      <div className="flex flex-col h-screen">
        <DashboardNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
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

            {/* Search and Filter Bar - Client Component */}
            <InventorySearchFilters categories={categories || []} />

            {/* Inventory Table - Client Component with React Query */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <InventoryClientTable />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
