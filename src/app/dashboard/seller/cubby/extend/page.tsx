"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Calendar,
  Clock,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "../../../../../../supabase/client";
import CubbyExtensionOptions from "@/components/seller/cubby-extension-options";
import { useCubbyExtension } from "@/hooks/use-cubby-extension";

export default function ExtendCubbyPage() {
  const [rentalPeriod, setRentalPeriod] = useState("monthly");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRental, setCurrentRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCubbyId, setSelectedCubbyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCubbyOptions, setShowCubbyOptions] = useState(false);

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

  // Calculate new end date based on current end date and rental period
  const calculatedNewEndDate = useMemo(() => {
    if (!currentRental) return null;

    const currentEndDate = new Date(currentRental.end_date);
    const newEndDate = new Date(currentEndDate);

    if (rentalPeriod === "weekly") {
      newEndDate.setDate(newEndDate.getDate() + 7);
    } else if (rentalPeriod === "monthly") {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (rentalPeriod === "quarterly") {
      newEndDate.setMonth(newEndDate.getMonth() + 3);
    }

    return newEndDate;
  }, [currentRental, rentalPeriod]);

  // Format dates for display and API calls
  const formattedCurrentEndDate = currentRental?.end_date || "";
  const formattedNewEndDate = calculatedNewEndDate?.toISOString() || "";

  // Use the cubby extension hook to check availability
  const {
    canExtendCurrentCubby,
    alternativeCubbies,
    loading: extensionLoading,
    error: extensionError,
  } = useCubbyExtension(
    currentRental?.cubby_id || "",
    formattedCurrentEndDate,
    formattedNewEndDate,
  );

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
        // Initially select the current cubby ID
        setSelectedCubbyId(data.cubby_id);
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

  // Reset selected cubby when rental period changes
  useEffect(() => {
    if (currentRental) {
      setSelectedCubbyId(null);
      setShowCubbyOptions(false);
      setSuccessMessage(null);
    }
  }, [rentalPeriod]);

  const handleCheckAvailability = () => {
    setShowCubbyOptions(true);
  };

  const handleExtendRental = async () => {
    if (!currentRental || !selectedCubbyId || !calculatedNewEndDate) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we're keeping the same cubby or reassigning
      const isReassignment = selectedCubbyId !== currentRental.cubby_id;

      // Start a transaction to ensure data consistency
      const { error: transactionError } = await supabase.rpc(
        "extend_cubby_rental",
        {
          p_rental_id: currentRental.id,
          p_new_end_date: calculatedNewEndDate.toISOString(),
          p_new_cubby_id: selectedCubbyId,
          p_additional_fee: rentalFees[rentalPeriod as keyof typeof rentalFees],
          p_is_reassignment: isReassignment,
        },
      );

      if (transactionError) {
        throw new Error(`Transaction failed: ${transactionError.message}`);
      }

      // If we need to update inventory items' cubby location for a reassignment
      if (isReassignment) {
        // Get the new cubby number for updating inventory items
        const { data: newCubbyData } = await supabase
          .from("cubbies")
          .select("cubby_number")
          .eq("id", selectedCubbyId)
          .single();

        if (newCubbyData) {
          // Update all inventory items linked to this rental
          const { error: updateItemsError } = await supabase
            .from("inventory_items")
            .update({
              cubby_id: selectedCubbyId,
              cubby_location: newCubbyData.cubby_number,
              last_updated: new Date().toISOString(),
            })
            .eq("seller_id", currentRental.seller_id)
            .eq("cubby_id", currentRental.cubby_id);

          if (updateItemsError) {
            console.error("Error updating inventory items:", updateItemsError);
            // Continue anyway as the rental was updated successfully
          }
        }

        setSuccessMessage(
          "Your cubby rental has been extended with a new cubby assignment. Please relocate your items to the new cubby.",
        );
      } else {
        setSuccessMessage("Your cubby rental has been successfully extended.");
      }

      // Redirect to payment page after a short delay to show the success message
      setTimeout(() => {
        router.push(
          `/dashboard/seller/cubby/payment?rental_id=${currentRental.id}&extended=true`,
        );
      }, 2000);
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

          {successMessage && (
            <div className="mb-6 bg-green-50 p-4 rounded-md flex items-start gap-3 text-green-800">
              <div className="h-5 w-5 mt-0.5 flex-shrink-0 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-green-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">Success!</p>
                <p className="text-sm mt-1">{successMessage}</p>
                <p className="text-sm mt-2">Redirecting to payment page...</p>
              </div>
            </div>
          )}

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

                    {!showCubbyOptions && (
                      <div className="flex justify-end mt-6">
                        <Button
                          onClick={handleCheckAvailability}
                          className="bg-pink-600 hover:bg-pink-700"
                        >
                          Check Availability
                        </Button>
                      </div>
                    )}

                    {/* Cubby Extension Options */}
                    {showCubbyOptions &&
                      currentRental &&
                      calculatedNewEndDate && (
                        <div className="mt-6">
                          <CubbyExtensionOptions
                            currentCubby={currentRental}
                            canExtendCurrentCubby={canExtendCurrentCubby}
                            alternativeCubbies={alternativeCubbies}
                            loading={extensionLoading}
                            error={extensionError}
                            onSelectCubby={setSelectedCubbyId}
                            selectedCubbyId={selectedCubbyId}
                          />
                        </div>
                      )}
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
                            {calculatedNewEndDate?.toLocaleDateString() || ""}
                          </p>
                        </div>
                      </div>

                      {showCubbyOptions && selectedCubbyId && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Selected Cubby
                          </h3>
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-medium">
                              {selectedCubbyId === currentRental.cubby_id
                                ? `Current Cubby #${currentRental.cubby?.cubby_number}`
                                : `New Cubby #${alternativeCubbies.find((c) => c.id === selectedCubbyId)?.cubby_number || ""}`}
                            </p>
                          </div>
                          {selectedCubbyId !== currentRental.cubby_id && (
                            <p className="text-xs text-amber-600 mt-2">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              You will need to relocate your items to the new
                              cubby
                            </p>
                          )}
                        </div>
                      )}

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
                    disabled={
                      isSubmitting ||
                      !showCubbyOptions ||
                      !selectedCubbyId ||
                      !!successMessage
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
