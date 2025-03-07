import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, SlidersHorizontal } from "lucide-react";
import DonationsTable from "@/components/inventory/donations-table";

export default async function DonationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch donations data
  const { data: donations } = await supabase
    .from("donations")
    .select("*")
    .order("donation_date", { ascending: false });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Donations</h1>
              <p className="text-gray-600 mt-1">
                Record and manage incoming donations
              </p>
            </div>

            <Button className="bg-teal-600 hover:bg-teal-700">
              <PlusCircle className="mr-2 h-5 w-5" />
              Record Donation
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
                placeholder="Search donations..."
                className="pl-10 w-full bg-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-shrink-0">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Input type="date" className="w-40" />
            </div>
          </div>

          {/* Donations Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <DonationsTable donations={donations || []} />
          </div>
        </div>
      </main>
    </>
  );
}
