import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Calendar, Clock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { memo } from "react";

interface CubbyRentalCardProps {
  activeCubby: any;
  daysRemaining: number;
}

// Memoized to prevent re-renders when parent components update but props don't change
const CubbyRentalCard = memo(function CubbyRentalCard({
  activeCubby,
  daysRemaining,
}: CubbyRentalCardProps) {
  if (!activeCubby) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">You don't have an active cubby rental</p>
          <p className="text-sm text-gray-400 mt-1 mb-6">
            Rent a cubby to display your items in our shop
          </p>
          <Button className="bg-pink-600 hover:bg-pink-700" asChild>
            <Link href="/dashboard/seller/cubby/rent">Rent a Cubby</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
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
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Listing Type
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {activeCubby.listing_type === "self"
                        ? "Self-Listing"
                        : "Staff-Managed"}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Commission:{" "}
                      {activeCubby.commission_rate
                        ? (activeCubby.commission_rate * 100).toFixed(0)
                        : 15}
                      %
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Rental Period
                    </h3>
                    <p className="text-lg">
                      {new Date(activeCubby.start_date).toLocaleDateString(
                        "en-NZ",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )}{" "}
                      -{" "}
                      {new Date(activeCubby.end_date).toLocaleDateString(
                        "en-NZ",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )}
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
                      Paid
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Rental Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                    <Link
                      href={`/dashboard/seller/cubby/extend?rental_id=${activeCubby.id}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Extend Rental
                    </Link>
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
  );
});

export default CubbyRentalCard;
