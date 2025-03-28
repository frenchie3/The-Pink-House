import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShoppingBag,
  Tag,
  CreditCard,
  Clock,
  Plus,
  DollarSign,
  Bell,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface Cubby {
  id: string;
  cubby_number: string;
  location?: string;
}

interface CubbyRental {
  id: string;
  cubby_id: string;
  start_date: string;
  end_date: string;
  rental_fee: number;
  status: string;
  payment_status: string;
  cubby: Cubby | Cubby[];
}

interface Earning {
  id: string;
  net_amount: number;
  gross_amount: number;
  commission_amount: number;
  payout_id: string | null;
  sale_item_id: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

// Helper function to get property from potentially array fields
const getProperty = <T,>(obj: T | T[] | null | undefined, property: keyof T): any => {
  if (!obj) return null;
  
  if (Array.isArray(obj)) {
    return obj[0]?.[property] ?? null;
  }
  
  return obj[property] ?? null;
};

export default async function SellerDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch seller data with optimized queries
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("id, name, sku, price, quantity")
    .eq("seller_id", user.id)
    .gt("quantity", 0)
    .limit(10); // Limit to 10 items for dashboard preview

  const { data: cubbyRentals } = await supabase
    .from("cubby_rentals")
    .select(
      "id, start_date, end_date, status, cubby_id, cubby:cubbies(cubby_number, location)",
    )
    .eq("seller_id", user.id)
    .order("end_date", { ascending: true });

  const { data: earnings } = await supabase
    .from("seller_earnings")
    .select("id, net_amount, payout_id, gross_amount, commission_amount, sale_item_id, created_at")
    .eq("seller_id", user.id);

  // Type assertion for earnings
  const typedEarnings = earnings as Earning[] | null;

  // Only fetch count of unread notifications for the badge
  const { count: notificationCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // Fetch a few notifications for preview
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, created_at")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Type assertion for notifications
  const typedNotifications = notifications as Notification[] | null;

  // Calculate total earnings
  const totalEarnings =
    typedEarnings?.reduce((sum, earning) => sum + earning.net_amount, 0) || 0;
  const availableBalance =
    typedEarnings?.reduce(
      (sum, earning) => (earning.payout_id ? sum : sum + earning.net_amount),
      0,
    ) || 0;

  // Get active cubby rental
  const activeCubby = cubbyRentals?.find(
    (rental: any) => rental.status === "active",
  );

  // Inside the component, add this type assertion for activeCubby
  const typedActiveCubby = activeCubby as CubbyRental | undefined;

  // Inside the JSX where activeCubby.cubby?.cubby_number is used, replace with:
  const cubbyNumber = typedActiveCubby ? getProperty(typedActiveCubby.cubby, 'cubby_number') : null;

  return (
    <>
      <div className="flex flex-col h-screen">
        <SellerNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Seller Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your listings, track sales, and view earnings
                </p>
              </div>

              <div className="flex gap-2">
                <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                  <a href="/dashboard/seller/listings/add">
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Item
                  </a>
                </Button>
                <Button variant="outline">
                  <Bell className="mr-2 h-5 w-5" />
                  Notifications
                  {typedNotifications && typedNotifications.length > 0 && (
                    <span className="ml-1 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {typedNotifications.length}
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
                    Active Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {activeCubby ? inventoryItems?.length || 0 : 0}
                    </div>
                    <Tag className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {formatPrice(totalEarnings)}
                    </div>
                    <DollarSign className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">
                      {formatPrice(availableBalance)}
                    </div>
                    <ShoppingBag className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Cubby Rental
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      {activeCubby ? (
                        <>
                          <div className="text-3xl font-bold">
                            {cubbyNumber}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Expires:{" "}
                            {typedActiveCubby?.end_date 
                              ? new Date(typedActiveCubby.end_date).toLocaleDateString(
                                  "en-NZ",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </div>
                        </>
                      ) : (
                        <div className="text-lg font-medium text-gray-500">
                          No active rental
                        </div>
                      )}
                    </div>
                    <CreditCard className="h-8 w-8 text-pink-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="listings" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="listings">My Listings</TabsTrigger>
                <TabsTrigger value="cubby">Cubby Details</TabsTrigger>
                <TabsTrigger value="earnings">Earnings & Payouts</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>My Listings</CardTitle>
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
                                Status
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventoryItems.map((item: InventoryItem) => (
                              <tr
                                key={item.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4">{item.name}</td>
                                <td className="py-3 px-4">{item.sku}</td>
                                <td className="py-3 px-4">
                                  {formatPrice(item.price)}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                  >
                                    {item.quantity > 0
                                      ? "Available"
                                      : "Sold Out"}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <Button variant="ghost" size="sm">
                                    Edit
                                  </Button>
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
                          You don't have any listings yet
                        </p>
                        <Button
                          className="mt-4 bg-pink-600 hover:bg-pink-700"
                          asChild
                        >
                          <a href="/dashboard/seller/listings/add">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Item
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cubby" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cubby Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeCubby ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Cubby Number
                              </h3>
                              <p className="text-2xl font-bold">
                                {cubbyNumber}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Location
                              </h3>
                              <p className="text-lg">
                                {typedActiveCubby ? getProperty(typedActiveCubby.cubby, 'location') || "Main Floor" : "Main Floor"}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Status
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Rental Period
                              </h3>
                              <p className="text-lg">
                                {typedActiveCubby?.start_date
                                  ? new Date(
                                      typedActiveCubby.start_date,
                                    ).toLocaleDateString("en-NZ", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "N/A"}{" "}
                                -{" "}
                                {typedActiveCubby?.end_date
                                  ? new Date(
                                      typedActiveCubby.end_date,
                                    ).toLocaleDateString("en-NZ", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Rental Fee
                              </h3>
                              <p className="text-lg">
                                {formatPrice(typedActiveCubby?.rental_fee)}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">
                                Payment Status
                              </h3>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {typedActiveCubby?.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-lg font-medium mb-4">
                            Rental Actions
                          </h3>
                          <div className="flex flex-wrap gap-4">
                            <Button className="bg-pink-600 hover:bg-pink-700">
                              <Calendar className="mr-2 h-4 w-4" />
                              Extend Rental
                            </Button>
                            <Button variant="outline">
                              <Clock className="mr-2 h-4 w-4" />
                              View Rental History
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">
                          You don't have an active cubby rental
                        </p>
                        <Button className="mt-4 bg-pink-600 hover:bg-pink-700">
                          Rent a Cubby
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="earnings" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Earnings & Payouts</CardTitle>
                    <Button
                      className="bg-pink-600 hover:bg-pink-700"
                      disabled={availableBalance <= 0}
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Request Payout
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">
                          Total Earnings
                        </h3>
                        <p className="text-2xl font-bold">
                          {formatPrice(totalEarnings)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">
                          Available Balance
                        </h3>
                        <p className="text-2xl font-bold">
                          {formatPrice(availableBalance)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">
                          Pending Payouts
                        </h3>
                        <p className="text-2xl font-bold">{formatPrice(0)}</p>
                      </div>
                    </div>

                    {typedEarnings && typedEarnings.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Date
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Item
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Gross Amount
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Commission
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Net Amount
                              </th>
                              <th className="text-left py-3 px-4 font-medium text-gray-500">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {typedEarnings.map((earning) => (
                              <tr
                                key={earning.id}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="py-3 px-4">
                                  {earning.created_at 
                                    ? new Date(
                                        earning.created_at,
                                      ).toLocaleDateString("en-NZ", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      })
                                    : "N/A"}
                                </td>
                                <td className="py-3 px-4">
                                  Item #{earning.sale_item_id.substring(0, 8)}
                                </td>
                                <td className="py-3 px-4">
                                  {formatPrice(earning.gross_amount)}
                                </td>
                                <td className="py-3 px-4">
                                  {formatPrice(earning.commission_amount)}
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {formatPrice(earning.net_amount)}
                                </td>
                                <td className="py-3 px-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${earning.payout_id ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                                  >
                                    {earning.payout_id ? "Paid" : "Available"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">
                          No earnings recorded yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typedNotifications && typedNotifications.length > 0 ? (
                      <div className="space-y-4">
                        {typedNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`p-2 rounded-full ${notification.type.includes("warning") || notification.type.includes("expiry") ? "bg-amber-100 text-amber-600" : "bg-pink-100 text-pink-600"}`}
                              >
                                <Bell className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-xs text-gray-500">
                                    {notification.created_at
                                      ? new Date(
                                          notification.created_at,
                                        ).toLocaleString("en-NZ", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "N/A"}
                                  </span>
                                  <Button variant="ghost" size="sm">
                                    Mark as Read
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No new notifications</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Seller Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Link
                href="/dashboard/seller/listings"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <Tag className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Manage Listings
                  </h3>
                  <p className="text-sm text-gray-500">
                    Add, edit, or remove your items
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/seller/cubby"
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
                    View or extend your cubby rental
                  </p>
                </div>
              </Link>

              <Link
                href="/dashboard/seller/earnings"
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
              >
                <div className="bg-pink-100 p-3 rounded-lg mr-4">
                  <DollarSign className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Earnings & Payouts
                  </h3>
                  <p className="text-sm text-gray-500">
                    Track sales and request payouts
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
