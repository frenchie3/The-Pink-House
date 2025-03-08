import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import CubbyRentalCard from "@/components/seller/cubby-rental-card";

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
      <main className="w-full bg-gray-50 h-screen overflow-auto">
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
              <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                <a href="/dashboard/seller/cubby/rent">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Rent a Cubby
                </a>
              </Button>
            )}
          </header>

          {/* Import and use the CubbyRentalCard component */}
          <CubbyRentalCard
            activeCubby={activeCubby}
            daysRemaining={daysRemaining}
          />

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
                            {new Date(rental.start_date).toLocaleDateString(
                              "en-NZ",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {new Date(rental.end_date).toLocaleDateString(
                              "en-NZ",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
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
                            <div className="mt-1 text-xs text-gray-500">
                              {rental.listing_type === "self"
                                ? "Self-Listing"
                                : "Staff-Managed"}
                              (
                              {rental.commission_rate
                                ? (rental.commission_rate * 100).toFixed(0)
                                : 15}
                              %)
                            </div>
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
