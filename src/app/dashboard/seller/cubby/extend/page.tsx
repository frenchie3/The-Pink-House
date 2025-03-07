"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, Calendar, Clock, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "../../../../../../supabase/client";

export default function ExtendCubbyPage() {
  const [rentalPeriod, setRentalPeriod] = useState("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRental, setCurrentRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get("rental_id");
  const supabase = createClient();

  // Rental fee structure
  const rentalFees = {
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  };

  useEffect(() => {
    const fetchCurrentRental = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        // If rental ID is provided, fetch that specific rental
        // Otherwise, fetch the active rental for the user
        let query = supabase
          .from("cubby_rentals")
          .select("*, cubby:cubbies(*)")
          .eq("seller_id", user.id);

        if (rentalId) {
          query = query.eq("id", rentalId);
        } else {
          query = query.eq("status", "active");
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("No active rental found");

        setCurrentRental(data);
      } catch (err) {
        console.error("Error fetching rental:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load rental details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentRental();
  }, [supabase, rentalId]);

  const handleExtendRental = async () => {
    if (!currentRental) return;

    setIsSubmitting(true);

    try {
      // Calculate new end date based on current end date
      const currentEndDate = new Date(currentRental.end_date);
      const newEndDate = new Date(currentEndDate);

      if (rentalPeriod === "weekly") {
        newEndDate.setDate(newEndDate.getDate() + 7);
      } else if (rentalPeriod === "monthly") {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      } else if (rentalPeriod === "quarterly") {
        newEndDate.setMonth(newEndDate.getMonth() + 3);
      }

      // Update the rental record
      const { error: updateError } = await supabase
        .from("cubby_rentals")
        .update({
          end_date: newEndDate.toISOString(),
          rental_fee:
            currentRental.rental_fee +
            rentalFees[rentalPeriod as keyof typeof rentalFees],
          // Auto-set to paid for demo purposes
          payment_status: "paid",
        })
        .eq("id", currentRental.id);

      if (updateError) throw updateError;

      // Redirect to payment page
      router.push(
        `/dashboard/seller/cubby/payment?rental_id=${currentRental.id}`,
      );
    } catch (err) {
      console.error("Error extending rental:", err);
      setError(err instanceof Error ? err.message : "Failed to extend rental");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rental details...</p>
            </div>
          </div>
        </main>
      </SellerGuard>
    );
  }

  if (error) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <div className="text-red-500 mb-4 text-lg">Error: {error}</div>
                <Button onClick={() => router.push("/dashboard/seller/cubby")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to My Cubby
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SellerGuard>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Extend Cubby Rental
              </h1>
              <p className="text-gray-600 mt-1">
                Extend your current cubby rental period
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Extension Options */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Extension Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {currentRental && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Current Rental
                        </h3>
                        <p className="font-medium">
                          Cubby #{currentRental.cubby?.cubby_number}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Current end date:{" "}
                          {new Date(
                            currentRental.end_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">
                        Select Extension Period
                      </h3>
                      <RadioGroup
                        value={rentalPeriod}
                        onValueChange={setRentalPeriod}
                        className="space-y-4"
                      >
                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="weekly" id="weekly" />
                          <Label
                            htmlFor="weekly"
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Weekly Extension</p>
                                <p className="text-sm text-gray-500">
                                  Add 7 more days
                                </p>
                              </div>
                              <p className="font-medium">
                                {formatPrice(rentalFees.weekly)}
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label
                            htmlFor="monthly"
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Monthly Extension</p>
                                <p className="text-sm text-gray-500">
                                  Add 30 more days
                                </p>
                              </div>
                              <p className="font-medium">
                                {formatPrice(rentalFees.monthly)}
                              </p>
                            </div>
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer bg-pink-50 border-pink-200">
                          <RadioGroupItem value="quarterly" id="quarterly" />
                          <Label
                            htmlFor="quarterly"
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  Quarterly Extension
                                </p>
                                <p className="text-sm text-gray-500">
                                  Add 90 more days
                                </p>
                              </div>
                              <p className="font-medium">
                                {formatPrice(rentalFees.quarterly)}
                              </p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Extension Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentRental && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          Current End Date
                        </h3>
                        <p className="text-lg font-medium">
                          {new Date(
                            currentRental.end_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">
                          New End Date
                        </h3>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-pink-600" />
                          <p className="text-lg font-medium">
                            {(() => {
                              const currentEndDate = new Date(
                                currentRental.end_date,
                              );
                              const newEndDate = new Date(currentEndDate);

                              if (rentalPeriod === "weekly") {
                                newEndDate.setDate(newEndDate.getDate() + 7);
                              } else if (rentalPeriod === "monthly") {
                                newEndDate.setMonth(newEndDate.getMonth() + 1);
                              } else if (rentalPeriod === "quarterly") {
                                newEndDate.setMonth(newEndDate.getMonth() + 3);
                              }

                              return newEndDate.toLocaleDateString();
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mt-4">
                          <span className="text-lg font-medium">
                            Extension Fee:
                          </span>
                          <span className="text-lg font-bold text-pink-600">
                            {formatPrice(
                              rentalFees[
                                rentalPeriod as keyof typeof rentalFees
                              ],
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    size="lg"
                    onClick={handleExtendRental}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Extend and Pay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </SellerGuard>
  );
}
