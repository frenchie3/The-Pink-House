import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import {
  BarChart3,
  BoxIcon,
  Search,
  ShoppingBag,
  Tag,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import InventoryStatsCards from "@/components/inventory/inventory-stats-cards";
import RecentActivityFeed from "@/components/inventory/recent-activity-feed";
import QuickActionButtons from "@/components/inventory/quick-action-buttons";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "seller";

  // Redirect based on role
  if (userRole === "admin") {
    return redirect("/dashboard/admin");
  } else if (userRole === "staff") {
    return redirect("/dashboard/staff");
  } else if (userRole === "seller") {
    return redirect("/dashboard/seller");
  }

  // Fetch inventory stats
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*");

  const { data: lowStockItems } = await supabase
    .from("inventory_items")
    .select("*")
    .lt("quantity", 5);

  const { data: recentSales } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })
    .limit(5);

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your inventory, track items, and process sales
              </p>
            </div>

            {/* Search Bar */}
            <div className="w-full md:w-auto flex gap-2">
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type="search"
                  placeholder="Search by SKU, name, or location..."
                  className="pl-10 w-full md:w-80 bg-white"
                />
              </div>
              <Button variant="outline" className="shrink-0">
                <span className="sr-only md:not-sr-only md:inline-block">
                  Filters
                </span>
                <Tag className="h-5 w-5 md:ml-2" />
              </Button>
            </div>
          </header>

          {/* Stats Cards */}
          <InventoryStatsCards
            totalItems={inventoryItems?.length || 0}
            lowStockItems={lowStockItems?.length || 0}
            recentSales={recentSales?.length || 0}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Quick Actions
                </h2>
                <QuickActionButtons />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Recent Activity
                </h2>
                <RecentActivityFeed />
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
            {[
              {
                title: "Inventory",
                description: "View and manage all inventory items",
                icon: <BoxIcon className="h-8 w-8 text-pink-600" />,
                href: "/dashboard/inventory",
              },
              {
                title: "Point of Sale",
                description: "Process sales and scan items",
                icon: <CreditCard className="h-8 w-8 text-pink-600" />,
                href: "/dashboard/pos",
              },
              {
                title: "Sales",
                description: "Track sales transactions",
                icon: <ShoppingBag className="h-8 w-8 text-pink-600" />,
                href: "/dashboard/sales",
              },
              {
                title: "Reports",
                description: "View analytics and generate reports",
                icon: <BarChart3 className="h-8 w-8 text-pink-600" />,
                href: "/dashboard/reports",
              },
            ].map((card, index) => (
              <Link
                key={index}
                href={card.href}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full"
              >
                <div className="mb-4">{card.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
