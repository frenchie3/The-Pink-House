// import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Download, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

// Helper function to get property from potentially array fields
const getProperty = <T,>(obj: T | T[] | null | undefined, property: keyof T): any => {
  if (!obj) return null;
  
  if (Array.isArray(obj)) {
    return obj[0]?.[property] ?? null;
  }
  
  return obj[property] ?? null;
};

// Helper to get nested properties safely
const getNestedProperty = (obj: any, path: string[]): any => {
  if (!obj) return null;
  
  let current = obj;
  for (const prop of path) {
    current = getProperty(current, prop);
    if (current === null || current === undefined) return null;
  }
  
  return current;
};

// Add interfaces for better type safety
interface Earning {
  id: string;
  sale_item_id: string;
  net_amount: number;
  gross_amount: number;
  commission_amount: number;
  payout_id: string | null;
  created_at: string;
  sale_item?: any;
}

interface Payout {
  id: string;
  amount: number;
  created_at: string;
  payout_date: string | null;
  status: string;
  notes: string | null;
}

export default async function SellerEarningsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch seller's earnings with pagination (20 items per page)
  const itemsPerPage = 20;

  const { data: earnings } = await supabase
    .from("seller_earnings")
    .select(
      "id, gross_amount, commission_amount, net_amount, created_at, payout_id, sale_item_id, sale_item:sale_items(inventory_item:inventory_items(name, sku))",
    )
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, itemsPerPage - 1);

  // Fetch seller's payouts with pagination
  const { data: payouts } = await supabase
    .from("seller_payouts")
    .select("id, amount, created_at, payout_date, status, notes")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .range(0, itemsPerPage - 1);

  // Type assertions for proper typing
  const typedEarnings = earnings as Earning[] | null;
  const typedPayouts = payouts as Payout[] | null;

  // Calculate totals
  const totalEarnings =
    typedEarnings?.reduce((sum, earning) => sum + earning.net_amount, 0) || 0;
  const availableBalance =
    typedEarnings?.reduce(
      (sum, earning) => (earning.payout_id ? sum : sum + earning.net_amount),
      0,
    ) || 0;
  const totalPaid =
    typedPayouts?.reduce((sum, payout) => sum + payout.amount, 0) || 0;

  return (
    <>
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Earnings & Payouts
          </h1>
          <p className="text-gray-600 mt-1">
            Track your sales and request payouts
          </p>
        </div>

        <Button
          className="bg-pink-600 hover:bg-pink-700"
          disabled={availableBalance <= 0}
        >
          <DollarSign className="mr-2 h-5 w-5" />
          Request Payout
        </Button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <div className="bg-pink-100 p-3 rounded-lg">
                <DollarSign className="h-6 w-6 text-pink-600" />
              </div>
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
              <div className="bg-green-100 p-3 rounded-lg">
                <ArrowUpRight className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">
                {formatPrice(totalPaid)}
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
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
                        {earning.created_at ? 
                          new Date(earning.created_at).toLocaleDateString(
                            "en-NZ",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            },
                          ) : "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        {getNestedProperty(earning.sale_item, ["inventory_item", "name"]) ||
                          `Item #${earning.sale_item_id.substring(0, 8)}`}
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
              <p className="text-gray-500">No earnings recorded yet</p>
              <p className="text-sm text-gray-400 mt-1">
                When your items sell, your earnings will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          {typedPayouts && typedPayouts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Date Requested
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Payout Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {typedPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {payout.created_at ? 
                          new Date(payout.created_at).toLocaleDateString(
                            "en-NZ",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          ) : "N/A"}
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatPrice(payout.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payout.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payout.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : payout.status === "approved"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {payout.status.charAt(0).toUpperCase() +
                            payout.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {payout.payout_date
                          ? new Date(
                              payout.payout_date,
                            ).toLocaleDateString("en-NZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4">{payout.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Download className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No payouts requested yet</p>
              <p className="text-sm text-gray-400 mt-1">
                When you request a payout, it will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
