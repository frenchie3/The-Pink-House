import DashboardNavbar from "@/components/dashboard-navbar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Package,
  CreditCard,
  Users,
  QrCode,
  Tag,
  Search,
  Bell,
  Plus,
  CheckCircle,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";

export default async function StaffDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch summary data with optimized queries
  const { data: inventoryItems, error: inventoryError } = await supabase
    .from("inventory_items")
    .select(
      "id, name, sku, price, quantity, cubby_location, seller_id, editing_locked",
    )
    .order("date_added", { ascending: false })
    .limit(10);

  const { data: cubbies, error: cubbiesError } = await supabase
    .from("cubbies")
    .select("id, cubby_number, status, location");

  const { data: cubbyRentals, error: rentalsError } = await supabase
    .from("cubby_rentals")
    .select(
      "id, cubby_id, seller_id, start_date, end_date, status, cubby:cubbies(cubby_number, location), seller:users(name, full_name)",
    )
    .order("end_date", { ascending: true });

  const { data: sellers, error: sellersError } = await supabase
    .from("users")
    .select("id, name, full_name, email, created_at, role")
    .eq("role", "seller");

  // Get total inventory count separately for accurate count
  const { count: totalInventoryCount, error: countError } = await supabase
    .from("inventory_items")
    .select("*", { count: "exact", head: true });

  // Log any errors for debugging
  if (
    inventoryError ||
    cubbiesError ||
    rentalsError ||
    sellersError ||
    countError
  ) {
    console.error("Error fetching staff dashboard data:", {
      inventoryError,
      cubbiesError,
      rentalsError,
      sellersError,
      countError,
    });
  }

  // Calculate stats
  const availableCubbies =
    cubbies?.filter((cubby) => cubby.status === "available").length || 0;
  const occupiedCubbies =
    cubbies?.filter((cubby) => cubby.status === "occupied").length || 0;
  const expiringRentals =
    cubbyRentals?.filter((rental) => {
      const endDate = new Date(rental.end_date);
      const today = new Date();
      const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays <= 7 && rental.status === "active";
    }).length || 0;

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
                  Staff Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage inventory, process sales, and handle cubby rentals
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="bg-pink-600 hover:bg-pink-700">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Process Sale
                </Button>
                <Button variant="outline">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                  {expiringRentals > 0 && (
                    <span className="ml-1 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {expiringRentals}
                    </span>
                  )}
                </Button>
              </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Inventory Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {totalInventoryCount || 0}
                    </div>
                    <Tag className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Available Cubbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{availableCubbies}</div>
                    <CreditCard className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Occupied Cubbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{occupiedCubbies}</div>
                    <Package className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Active Sellers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {sellers?.length || 0}
                    </div>
                    <Users className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    type="search"
                    placeholder="Search by SKU, name, seller, or cubby..."
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <QrCode className="mr-2 h-5 w-5" />
                    Scan Barcode
                  </Button>
                  <Button variant="outline">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Item
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="cubbies">Cubby Management</TabsTrigger>
                <TabsTrigger value="sellers">Seller Management</TabsTrigger>
                <TabsTrigger value="sales">Sales & Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Inventory Items</CardTitle>
                    <Button className="bg-pink-600 hover:bg-pink-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Item
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {inventoryItems && inventoryItems.length > 0 ? (
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
                                Cubby
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Seller
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryItems.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4">{item.name}</td>
                                <td className="py-3 px-4">{item.sku}</td>
                                <td className="py-3 px-4">
                                  {formatPrice(item.price)}
                                </td>
                                <td className="py-3 px-4">{item.quantity}</td>
                                <td className="py-3 px-4">
                                  {item.cubby_location || "—"}
                                </td>
                                <td className="py-3 px-4">
                                  {item.seller_id
                                    ? item.seller_id.substring(0, 8)
                                    : "Shop"}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex space-x-2">
                                    <Button variant="ghost" size="sm">
                                      Edit
                                    </Button>
                                    {!item.editing_locked && (
                                      <form
                                        action={async (formData) => {
                                          "use server";
                                          const supabase = await createClient();
                                          await supabase
                                            .from("inventory_items")
                                            .update({ editing_locked: true })
                                            .eq("id", item.id);
                                        }}
                                      >
                                        <Button
                                          type="submit"
                                          variant="ghost"
                                          size="sm"
                                          className="text-green-600"
                                        >
                                          Print Labels
                                        </Button>
                                      </form>
                                    )}
                                    {item.editing_locked && (
                                      <span className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-4 w-4" />
                                        Labels Printed
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
                        <p className="text-gray-500">
                          No inventory items found
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cubbies" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Cubby Rentals</CardTitle>
                    <Button className="bg-pink-600 hover:bg-pink-700">
                      <Plus className="mr-2 h-4 w-4" />
                      New Rental
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {cubbyRentals && cubbyRentals.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Cubby
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Seller
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Start Date
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                End Date
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Status
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Payment
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cubbyRentals.map((rental) => {
                              const endDate = new Date(rental.end_date);
                              const today = new Date();
                              const diffDays = Math.ceil(
                                (endDate.getTime() - today.getTime()) /
                                  (1000 * 60 * 60 * 24),
                              );
                              const isExpiringSoon =
                                diffDays <= 7 && diffDays > 0;

                              return (
                                <tr
                                  key={rental.id}
                                  className="border-b hover:bg-gray-50"
                                >
                                  <td className="py-3 px-4">
                                    {rental.cubby?.cubby_number}
                                  </td>
                                  <td className="py-3 px-4">
                                    {rental.seller?.full_name ||
                                      rental.seller?.name ||
                                      "Unknown"}
                                  </td>
                                  <td className="py-3 px-4">
                                    {new Date(
                                      rental.start_date,
                                    ).toLocaleDateString("en-NZ", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })}
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={
                                        isExpiringSoon
                                          ? "text-amber-600 font-medium"
                                          : ""
                                      }
                                    >
                                      {new Date(
                                        rental.end_date,
                                      ).toLocaleDateString("en-NZ", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })}
                                      {isExpiringSoon && ` (${diffDays} days)`}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rental.status === "active" ? "bg-green-100 text-green-800" : rental.status === "expired" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}
                                    >
                                      {rental.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rental.payment_status === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                                    >
                                      {rental.payment_status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <Button variant="ghost" size="sm">
                                      Manage
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No cubby rentals found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sellers">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Seller Management</CardTitle>
                    <Button className="bg-pink-600 hover:bg-pink-700">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Seller
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {sellers && sellers.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Name
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Email
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Joined
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Cubby
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Items
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellers.map((seller) => (
                              <tr
                                key={seller.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4">
                                  {seller.full_name || seller.name}
                                </td>
                                <td className="py-3 px-4">{seller.email}</td>
                                <td className="py-3 px-4">
                                  {new Date(
                                    seller.created_at,
                                  ).toLocaleDateString("en-NZ", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </td>
                                <td className="py-3 px-4">—</td>
                                <td className="py-3 px-4">0</td>
                                <td className="py-3 px-4">
                                  <Button variant="ghost" size="sm">
                                    View Details
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No sellers found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales">
                <Card>
                  <CardHeader>
                    <CardTitle>Sales & Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center py-12 text-gray-500">
                      Sales and transaction data will be displayed here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Staff Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-8">
              <Link
                href="/dashboard/pos"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <ShoppingBag className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Point of Sale</h3>
                  <p className="text-sm text-gray-500">
                    Process sales transactions
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/staff/inventory"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Tag className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Inventory</h3>
                  <p className="text-sm text-gray-500">
                    Manage items and stock
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/staff/print-labels"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Printer className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Print Labels</h3>
                  <p className="text-sm text-gray-500">
                    Print labels and lock items
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/staff/cubbies"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <CreditCard className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Cubby Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage rentals and assignments
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/staff/sellers"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Seller Management
                  </h3>
                  <p className="text-sm text-gray-500">
                    Manage seller accounts
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
