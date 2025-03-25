import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Calendar, User, CreditCard, Package } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";

// Types
interface CubbyRental {
  id: string;
  cubby_id: string;
  seller_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "pending_extension" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
  rental_fee: number;
  listing_type: "self" | "staff";
  commission_rate: number;
  seller: {
    full_name: string;
    email: string;
    phone?: string;
  };
  cubby: {
    cubby_number: string;
    location: string;
  };
}

export default async function CubbyRentalDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch rental details with seller and cubby information
  const { data: rental, error } = await supabase
    .from("cubby_rentals")
    .select(`
      *,
      seller:users!cubby_rentals_seller_id_fkey(full_name, email, phone),
      cubby:cubbies!cubby_rentals_cubby_id_fkey(cubby_number, location)
    `)
    .eq("id", params.id)
    .single();

  if (error) {
    console.error("Error fetching rental:", error);
  }

  // Debug log to see the data structure
  console.log("Rental data:", JSON.stringify(rental, null, 2));

  if (!rental) {
    return redirect("/dashboard/staff/cubby-management");
  }

  // Helper functions for safe property access
  const getSellerName = (rental: CubbyRental) => rental.seller?.full_name || "Unknown";
  const getSellerEmail = (rental: CubbyRental) => rental.seller?.email || "Unknown";
  const getSellerPhone = (rental: CubbyRental) => rental.seller?.phone || "Not provided";
  const getCubbyNumber = (rental: CubbyRental) => rental.cubby?.cubby_number || "Unknown";
  const getCubbyLocation = (rental: CubbyRental) => rental.cubby?.location || "Unknown";

  // Helper function for NZ date format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <DashboardNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Cubby Rental Details</h1>
                <p className="text-gray-600 mt-1">
                  Manage rental #{params.id}
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/dashboard/staff/cubby-management">
                  Back to Overview
                </Link>
              </Button>
            </div>

            {/* Status Banner */}
            <div className={`mb-8 p-4 rounded-lg ${
              rental.status === "active" 
                ? "bg-green-50 text-green-800" 
                : rental.status === "expired"
                ? "bg-red-50 text-red-800"
                : "bg-amber-50 text-amber-800"
            }`}>
              <div className="flex items-center gap-2">
                {rental.status === "expired" && <AlertCircle className="h-5 w-5" />}
                {rental.status === "pending_extension" && <Clock className="h-5 w-5" />}
                <span className="font-medium">
                  Status: {rental.status.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Main Details */}
              <div className="md:col-span-2 space-y-6">
                {/* Cubby Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Cubby Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Cubby Number</h3>
                        <p className="text-lg font-medium">#{getCubbyNumber(rental)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Location</h3>
                        <p className="text-lg">{getCubbyLocation(rental)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Listing Type</h3>
                        <p className="text-lg capitalize">{rental.listing_type}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Commission Rate</h3>
                        <p className="text-lg">{(rental.commission_rate * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Rental Period */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Rental Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Start Date</h3>
                        <p className="text-lg">
                          {formatDate(rental.start_date)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">End Date</h3>
                        <p className="text-lg">
                          {formatDate(rental.end_date)}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Rental Fee</h3>
                        <p className="text-lg">${rental.rental_fee.toFixed(2)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Payment Status</h3>
                        <Badge
                          variant={
                            rental.payment_status === "paid"
                              ? "default"
                              : rental.payment_status === "pending"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {rental.payment_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Seller Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Seller Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Name</h3>
                        <p className="text-lg font-medium">{getSellerName(rental)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Email</h3>
                        <p className="text-lg">{getSellerEmail(rental)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                        <p className="text-lg">{getSellerPhone(rental)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rental.status === "pending_extension" && (
                        <Button className="w-full bg-green-600 hover:bg-green-700">
                          Approve Extension
                        </Button>
                      )}
                      {rental.status === "active" && (
                        <Button className="w-full" variant="outline">
                          Extend Rental
                        </Button>
                      )}
                      {rental.status === "expired" && (
                        <Button className="w-full" variant="outline">
                          Process Expiration
                        </Button>
                      )}
                      <Button className="w-full" variant="outline">
                        View Items
                      </Button>
                      <Button className="w-full" variant="outline">
                        Print Labels
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
} 