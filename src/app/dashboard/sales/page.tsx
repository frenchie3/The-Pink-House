import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import SalesTable from "@/components/inventory/sales-table";

export default async function SalesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch sales data
  const { data: sales } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 mt-1">
                Track and manage all sales transactions
              </p>
            </div>

            <Button className="bg-teal-600 hover:bg-teal-700">
              <PlusCircle className="mr-2 h-5 w-5" />
              New Sale
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
                placeholder="Search sales..."
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
                <option value="all">All Payment Methods</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              <Input type="date" className="w-40" />
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <SalesTable sales={sales || []} />
          </div>
        </div>
      </main>
    </>
  );
}
