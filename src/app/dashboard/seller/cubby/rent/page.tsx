"use client";

import { useState } from "react";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../../../supabase/client";

export default function RentCubbyPage() {
  const [rentalPeriod, setRentalPeriod] = useState("monthly");
  const [listingType, setListingType] = useState("self");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Rental fee structure
  const rentalFees = {
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  };

  // Commission rates based on listing type
  const commissionRates = {
    self: 0.15, // 15% for self-listing
    staff: 0.25, // 25% for staff-managed listing
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get available cubby
      const { data: availableCubby, error: cubbyError } = await supabase
        .from("cubbies")
        .select("id, cubby_number, location")
        .eq("status", "available")
        .limit(1)
        .single();

      if (cubbyError || !availableCubby) {
        throw new Error("No available cubbies found");
      }

      // Calculate rental dates
      const startDate = new Date();
      const endDate = new Date();

      if (rentalPeriod === "weekly") {
        endDate.setDate(endDate.getDate() + 7);
      } else if (rentalPeriod === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (rentalPeriod === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3);
      }

      // Create cubby rental record
      const { data: rental, error: rentalError } = await supabase
        .from("cubby_rentals")
        .insert({
          cubby_id: availableCubby.id,
          seller_id: user.id,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          rental_fee: rentalFees[rentalPeriod as keyof typeof rentalFees],
          status: "active",
          payment_status: "pending", // This would be updated after payment processing
        })
        .select();

      if (rentalError) {
        throw new Error("Failed to create rental: " + rentalError.message);
      }

      // Update cubby status to occupied
      const { error: updateError } = await supabase
        .from("cubbies")
        .update({ status: "occupied" })
        .eq("id", availableCubby.id);

      if (updateError) {
        throw new Error("Failed to update cubby status");
      }

      // Store the listing type preference in user profile
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          listing_preference: listingType,
          commission_rate:
            commissionRates[listingType as keyof typeof commissionRates],
        })
        .eq("id", user.id);

      if (userUpdateError) {
        console.error("Failed to update user preferences", userUpdateError);
      }

      // Redirect to payment page or confirmation
      router.push("/dashboard/seller/cubby/payment?rental_id=" + rental[0].id);
    } catch (error) {
      console.error("Error renting cubby:", error);
      alert(error instanceof Error ? error.message : "Failed to rent cubby");
      setIsSubmitting(false);
    }
  };

  return (
    <SellerGuard>
      <SellerNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rent a Cubby</h1>
              <p className="text-gray-600 mt-1">
                Choose your rental period and listing preferences
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rental Options */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Cubby Rental Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="period" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8">
                      <TabsTrigger value="period">Rental Period</TabsTrigger>
                      <TabsTrigger value="listing">Listing Type</TabsTrigger>
                    </TabsList>

                    <TabsContent value="period" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Select Rental Period
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
                                  <p className="font-medium">Weekly Rental</p>
                                  <p className="text-sm text-gray-500">
                                    7 days access to your cubby
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
                                  <p className="font-medium">Monthly Rental</p>
                                  <p className="text-sm text-gray-500">
                                    30 days access to your cubby
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
                                    Quarterly Rental
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    90 days access to your cubby
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
                    </TabsContent>

                    <TabsContent value="listing" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Choose Listing Type
                        </h3>
                        <RadioGroup
                          value={listingType}
                          onValueChange={setListingType}
                          className="space-y-4"
                        >
                          <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <RadioGroupItem value="self" id="self" />
                            <Label
                              htmlFor="self"
                              className="flex-1 cursor-pointer"
                            >
                              <div>
                                <p className="font-medium">Self-Listing</p>
                                <p className="text-sm text-gray-500 mb-2">
                                  You'll enter item details yourself (name,
                                  description, price, photos)
                                </p>
                                <div className="flex items-center text-sm text-pink-600">
                                  <span className="font-medium">
                                    Commission Rate:{" "}
                                    {commissionRates.self * 100}%
                                  </span>
                                </div>
                              </div>
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <RadioGroupItem value="staff" id="staff" />
                            <Label
                              htmlFor="staff"
                              className="flex-1 cursor-pointer"
                            >
                              <div>
                                <p className="font-medium">
                                  Staff-Managed Listing
                                </p>
                                <p className="text-sm text-gray-500 mb-2">
                                  Drop off your items and our staff will handle
                                  the listing process
                                </p>
                                <div className="flex items-center text-sm text-pink-600">
                                  <span className="font-medium">
                                    Commission Rate:{" "}
                                    {commissionRates.staff * 100}%
                                  </span>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Rental Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Selected Plan
                      </h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-pink-600" />
                        <p className="text-lg font-medium">
                          {rentalPeriod.charAt(0).toUpperCase() +
                            rentalPeriod.slice(1)}{" "}
                          Rental
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Listing Preference
                      </h3>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-pink-600" />
                        <p className="text-lg font-medium">
                          {listingType === "self"
                            ? "Self-Listing"
                            : "Staff-Managed"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Rental Fee:</span>
                        <span className="font-medium">
                          {formatPrice(
                            rentalFees[rentalPeriod as keyof typeof rentalFees],
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Commission Rate:</span>
                        <span className="font-medium">
                          {commissionRates[
                            listingType as keyof typeof commissionRates
                          ] * 100}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t">
                        <span className="text-lg font-medium">
                          Total Due Now:
                        </span>
                        <span className="text-lg font-bold text-pink-600">
                          {formatPrice(
                            rentalFees[rentalPeriod as keyof typeof rentalFees],
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    size="lg"
                    onClick={handleSubmit}
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
                        Proceed to Payment
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
