import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default async function SellerCubbyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch seller's cubby rental
  const { data: cubbyRentals } = await supabase
    .from("cubby_rentals")
    .select("*, cubby:cubbies(*)")
    .eq("seller_id", user.id)
    .order("end_date", { ascending: true });

  // Get active cubby rental
  const activeCubby = cubbyRentals?.find(
    (rental) => rental.status === "active",
  );

  // Calculate days remaining if there's an active rental
  let daysRemaining = 0;
  if (activeCubby) {
    const endDate = new Date(activeCubby.end_date);
    const today = new Date();
    daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  return (
    <SellerGuard>
      <SellerNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Cubby</h1>
              <p className="text-gray-600 mt-1">
                Manage your cubby rental and view details
              </p>
            </div>

            {!activeCubby && (
              <Button className="bg-pink-600 hover:bg-pink-700">
                <CreditCard className="mr-2 h-5 w-5" />
                Rent a Cubby
              </Button>
            )}
          </header>

          {activeCubby ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cubby Details */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cubby Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Cubby Number
                            </h3>
                            <p className="text-2xl font-bold">
                              {activeCubby.cubby?.cubby_number}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Location
                            </h3>
                            <p className="text-lg">
                              {activeCubby.cubby?.location || "Main Floor"}
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
                              {new Date(
                                activeCubby.start_date,
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                activeCubby.end_date,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Rental Fee
                            </h3>
                            <p className="text-lg">
                              {formatPrice(activeCubby.rental_fee)}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">
                              Payment Status
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {activeCubby.payment_status
                                .charAt(0)
                                .toUpperCase() +
                                activeCubby.payment_status.slice(1)}
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
                  </CardContent>
                </Card>
              </div>

              {/* Cubby Status */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Rental Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500">
                          Days Remaining
                        </h3>
                        <div className="flex items-end gap-2">
                          <p className="text-3xl font-bold">{daysRemaining}</p>
                          <p className="text-sm text-gray-500 mb-1">days</p>
                        </div>
                        {daysRemaining <= 7 && (
                          <p className="text-xs text-amber-600 mt-1">
                            Your rental will expire soon. Consider extending it.
                          </p>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Rental Options
                        </h3>
                        <div className="space-y-2">
                          <div className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">Weekly Rental</p>
                              <p className="text-sm text-gray-500">7 days</p>
                            </div>
                            <p className="font-medium">{formatPrice(10)}</p>
                          </div>
                          <div className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                              <p className="font-medium">Monthly Rental</p>
                              <p className="text-sm text-gray-500">30 days</p>
                            </div>
                            <p className="font-medium">{formatPrice(35)}</p>
                          </div>
                          <div className="p-3 border rounded-lg flex justify-between items-center bg-pink-50 border-pink-200">
                            <div>
                              <p className="font-medium">Quarterly Rental</p>
                              <p className="text-sm text-gray-500">90 days</p>
                            </div>
                            <p className="font-medium">{formatPrice(90)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">
                  You don't have an active cubby rental
                </p>
                <p className="text-sm text-gray-400 mt-1 mb-6">
                  Rent a cubby to display your items in our shop
                </p>
                <Button className="bg-pink-600 hover:bg-pink-700">
                  Rent a Cubby
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Rental History */}
          {cubbyRentals && cubbyRentals.length > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Rental History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Cubby
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Start Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          End Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Fee
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Payment
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cubbyRentals.map((rental) => (
                        <tr
                          key={rental.id}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="py-3 px-4">
                            {rental.cubby?.cubby_number}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(rental.start_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(rental.end_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            {formatPrice(rental.rental_fee)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rental.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : rental.status === "expired"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {rental.status.charAt(0).toUpperCase() +
                                rental.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                rental.payment_status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : rental.payment_status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {rental.payment_status.charAt(0).toUpperCase() +
                                rental.payment_status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </SellerGuard>
  );
}
