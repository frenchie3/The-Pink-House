"use client";

import { useState, useEffect } from "react";
import SellerNavbar from "@/components/seller-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../../../supabase/client";
import { Input } from "@/components/ui/input";
import AvailableCubbies from "@/components/seller/available-cubbies";

export default function RentCubbyPage() {
  const [rentalPeriod, setRentalPeriod] = useState("monthly");
  const [listingType, setListingType] = useState("self");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [availableCubbies, setAvailableCubbies] = useState<any[]>([]);
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Rental fee structure
  const rentalFees = {
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  };

  // Commission rates based on listing type - will be fetched from system settings
  const [commissionRates, setCommissionRates] = useState({
    self: 0.15, // 15% for self-listing (default)
    staff: 0.25, // 25% for staff-managed listing (default)
  });

  // Set default start date to today
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setStartDate(formattedDate);
  }, []);

  useEffect(() => {
    // Fetch commission rates from system settings
    const fetchCommissionRates = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "commission_rates")
          .single();

        if (error) throw error;
        if (data && data.setting_value) {
          setCommissionRates({
            self: data.setting_value.default || 0.15,
            staff: data.setting_value.staff || 0.25,
          });
        }
      } catch (err) {
        console.error("Error fetching commission rates:", err);
        // Keep default values if there's an error
      }
    };

    fetchCommissionRates();
  }, [supabase]);

  // Calculate end date based on start date and rental period
  const calculateEndDate = (start: string, period: string) => {
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);

    if (period === "weekly") {
      endDateObj.setDate(endDateObj.getDate() + 7);
    } else if (period === "monthly") {
      endDateObj.setMonth(endDateObj.getMonth() + 1);
    } else if (period === "quarterly") {
      endDateObj.setMonth(endDateObj.getMonth() + 3);
    }

    return endDateObj.toISOString().split("T")[0];
  };

  // Calculate end date based on start date and rental period
  const calculateEndDateString = (start: string, period: string) => {
    if (!start) return "";
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);

    if (period === "weekly") {
      endDateObj.setDate(endDateObj.getDate() + 7);
    } else if (period === "monthly") {
      endDateObj.setMonth(endDateObj.getMonth() + 1);
    } else if (period === "quarterly") {
      endDateObj.setMonth(endDateObj.getMonth() + 3);
    }

    return endDateObj.toISOString().split("T")[0];
  };

  // Get the calculated end date based on the selected start date and rental period
  const calculatedEndDate = calculateEndDateString(startDate, rentalPeriod);

  // Handle cubby selection from the AvailableCubbies component
  const handleCubbySelection = (cubbyId: string) => {
    setSelectedCubby(cubbyId);
    // Find the cubby object to display details
    const selectedCubbyObj = availableCubbies.find((c) => c.id === cubbyId);
    if (selectedCubbyObj) {
      console.log("Selected cubby:", selectedCubbyObj);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!startDate) {
        throw new Error("Please select a start date");
      }

      if (!selectedCubby) {
        throw new Error("Please select an available cubby");
      }

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get the selected cubby
      const selectedCubbyObj = availableCubbies.find(
        (c) => c.id === selectedCubby,
      );
      if (!selectedCubbyObj) {
        throw new Error("Selected cubby not found");
      }

      // Calculate rental dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(calculateEndDate(startDate, rentalPeriod));

      // Create cubby rental record
      const { data: rental, error: rentalError } = await supabase
        .from("cubby_rentals")
        .insert({
          cubby_id: selectedCubbyObj.id,
          seller_id: user.id,
          start_date: startDateObj.toISOString(),
          end_date: endDateObj.toISOString(),
          rental_fee: rentalFees[rentalPeriod as keyof typeof rentalFees],
          status: "active",
          payment_status: "paid", // Auto-set to paid for demo purposes
          listing_type: listingType,
          commission_rate:
            commissionRates[listingType as keyof typeof commissionRates],
        })
        .select();

      if (rentalError) {
        throw new Error("Failed to create rental: " + rentalError.message);
      }

      // Update cubby status to occupied
      const { error: updateError } = await supabase
        .from("cubbies")
        .update({
          status: "occupied",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedCubbyObj.id);

      if (updateError) {
        throw new Error("Failed to update cubby status");
      }

      // Redirect to payment page or confirmation
      router.push("/dashboard/seller/cubby/payment?rental_id=" + rental[0].id);
    } catch (error) {
      console.error("Error renting cubby:", error);
      setError(error instanceof Error ? error.message : "Failed to rent cubby");
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                      <TabsTrigger value="period">Rental Period</TabsTrigger>
                      <TabsTrigger value="cubby">Select Cubby</TabsTrigger>
                      <TabsTrigger value="listing">Listing Type</TabsTrigger>
                    </TabsList>

                    <TabsContent value="period" className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-date">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500">
                            Select when you want your rental to begin
                          </p>
                        </div>

                        <h3 className="text-lg font-medium mt-6">
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

                    <TabsContent value="cubby" className="space-y-6">
                      <div className="space-y-4">
                        {startDate ? (
                          <>
                            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 mb-4">
                              <p className="text-sm">
                                <strong>Rental Period:</strong>{" "}
                                {new Date(startDate).toLocaleDateString()} to{" "}
                                {new Date(
                                  calculatedEndDate,
                                ).toLocaleDateString()}
                              </p>
                              <p className="text-xs mt-1">
                                Only cubbies that are available for your entire
                                rental period are shown. If you don't see any
                                available cubbies, try selecting different
                                dates.
                              </p>
                            </div>

                            <AvailableCubbies
                              startDate={startDate}
                              endDate={calculatedEndDate}
                              onSelectCubby={handleCubbySelection}
                            />
                          </>
                        ) : (
                          <div className="bg-amber-50 p-4 rounded-lg text-amber-800">
                            <p className="text-sm">
                              <strong>Please select a start date</strong> in the
                              "Rental Period" tab to see available cubbies.
                            </p>
                          </div>
                        )}
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
                                  You'll enter all item details yourself (name,
                                  description, price, photos). You can edit
                                  items until they are reviewed by staff.
                                </p>
                                <div className="flex items-center text-sm text-pink-600">
                                  <span className="font-medium">
                                    Commission Rate:{" "}
                                    {commissionRates.self * 100}%
                                  </span>
                                </div>
                                <div className="mt-2 bg-amber-50 p-2 rounded-md text-xs text-amber-800">
                                  <strong>Note:</strong> This choice cannot be
                                  changed after rental and applies to all items
                                  in this cubby.
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
                                <p className="font-medium">Staff-Managed</p>
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
                                <div className="mt-2 bg-amber-50 p-2 rounded-md text-xs text-amber-800">
                                  <strong>Note:</strong> This choice cannot be
                                  changed after rental and applies to all items
                                  in this cubby.
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
                        Rental Period
                      </h3>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-pink-600" />
                        <div>
                          <p className="text-lg font-medium">
                            {rentalPeriod.charAt(0).toUpperCase() +
                              rentalPeriod.slice(1)}
                          </p>
                          {startDate && (
                            <p className="text-sm text-gray-600">
                              {new Date(startDate).toLocaleDateString()} to{" "}
                              {new Date(
                                calculateEndDate(startDate, rentalPeriod),
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        Selected Cubby
                      </h3>
                      {selectedCubby ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-pink-600" />
                          <p className="text-lg font-medium">
                            Cubby #
                            {availableCubbies.find(
                              (c) => c.id === selectedCubby,
                            )?.cubby_number || ""}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">
                          No cubby selected
                        </p>
                      )}
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

                  {error && (
                    <div className="bg-red-50 p-3 rounded-md text-red-800 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      !selectedCubby ||
                      !startDate ||
                      availableCubbies.length === 0
                    }
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
    </>
  );
}
