import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";
import { LayoutWrapper, MainContent } from "@/components/layout-wrapper";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <LayoutWrapper>
      <DashboardNavbar />
      <MainContent>
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              View insights and generate reports about your inventory and sales
            </p>
          </header>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sales Overview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Sales Overview
                </h2>
                <TrendingUp className="h-5 w-5 text-pink-600" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <LineChart className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500 ml-3">
                  Sales chart will appear here
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-xl font-bold text-gray-900">$1,234.56</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Items Sold</p>
                  <p className="text-xl font-bold text-gray-900">42</p>
                </div>
              </div>
            </div>

            {/* Inventory Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Inventory Status
                </h2>
                <PieChart className="h-5 w-5 text-pink-600" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <PieChart className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500 ml-3">
                  Inventory chart will appear here
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-xl font-bold text-gray-900">156</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Low Stock</p>
                  <p className="text-xl font-bold text-gray-900">8</p>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Category Distribution
                </h2>
                <BarChart3 className="h-5 w-5 text-pink-600" />
              </div>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <BarChart3 className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500 ml-3">
                  Category chart will appear here
                </p>
              </div>
              <div className="mt-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Top Category</p>
                  <p className="text-xl font-bold text-gray-900">
                    Clothing (42%)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Export Reports Section */}
          <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Export Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <h3 className="font-medium mb-1">Inventory Report</h3>
                <p className="text-sm text-gray-500">
                  Export complete inventory with status
                </p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <h3 className="font-medium mb-1">Sales Report</h3>
                <p className="text-sm text-gray-500">
                  Export sales data with transaction details
                </p>
              </button>
            </div>
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}
