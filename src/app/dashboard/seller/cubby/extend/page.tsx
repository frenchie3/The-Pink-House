"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  CheckCircle2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "../../../../../../supabase/client";
import CubbyExtensionOptions from "@/components/seller/cubby-extension-options";
import { useCubbyExtension } from "@/hooks/use-cubby-extension";
import { LayoutWrapper, MainContent } from "@/components/layout-wrapper";

// Inner component that uses useSearchParams
function ExtendCubbyInner() {
  const [rentalPeriod, setRentalPeriod] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRental, setCurrentRental] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCubbyId, setSelectedCubbyId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCubbyOptions, setShowCubbyOptions] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get("rental_id");
  const supabase = createClient();

  // Rental fee structure - will be dynamically updated from system settings
  const [rentalFees, setRentalFees] = useState({
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  });

  // Shop open days settings - fetched from system_settings table
  const [openDays, setOpenDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });

  // Helper function to check if a date is a shop open day
  const isShopOpenDay = (date: Date) => {
    const dayOfWeek = date
      .toLocaleDateString("en-US", {
        weekday: "long",
      })
      .toLowerCase();
    return openDays[dayOfWeek as keyof typeof openDays] === true;
  };

  // Calculate new end date based on current end date and rental period, counting only open days
  const calculatedNewEndDate = useMemo(() => {
    if (!currentRental) return null;

    const currentEndDate = new Date(currentRental.end_date);

    // Determine how many open days we need based on the rental period
    let requiredOpenDays = 0;
    if (rentalPeriod === "weekly") {
      requiredOpenDays = 7;
    } else if (rentalPeriod === "monthly") {
      requiredOpenDays = 30; // Simplified to 30 days for a month
    } else if (rentalPeriod === "quarterly") {
      requiredOpenDays = 90; // Simplified to 90 days for a quarter
    }

    // Count forward from the current end date, only counting days when the shop is open
    let openDaysCount = 0;
    let currentDate = new Date(currentEndDate);
    let maxIterations = 365; // Safety to prevent infinite loop
    let iterations = 0;

    while (openDaysCount < requiredOpenDays && iterations < maxIterations) {
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
      iterations++;

      // Check if this day is a shop open day
      if (isShopOpenDay(currentDate)) {
        openDaysCount++;
      }
    }

    return currentDate;
  }, [currentRental, rentalPeriod, openDays]);

  // Format dates for display and API calls
  const formattedCurrentEndDate = currentRental?.end_date || "";
  const formattedNewEndDate = calculatedNewEndDate?.toISOString() || "";

  // Calculate the actual number of calendar days in the rental period
  const calendarDays = useMemo(() => {
    if (!currentRental || !calculatedNewEndDate) return 0;
    const startDate = new Date(currentRental.end_date);
    const endDate = calculatedNewEndDate;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [currentRental, calculatedNewEndDate]);

  // Always call the hook but with empty strings when not checking availability
  // This follows React's rules about hooks being called in same order
  const {
    canExtendCurrentCubby,
    alternativeCubbies,
    loading: extensionLoading,
    error: extensionError,
  } = useCubbyExtension(
    // Pass the cubby ID directly - no need to search by rental ID
    checkingAvailability && currentRental ? currentRental.cubby_id : "",
    // Still need the current end date for calculating the extension period
    checkingAvailability && formattedCurrentEndDate
      ? formattedCurrentEndDate
      : "",
    // And the new end date to check availability until
    checkingAvailability && formattedNewEndDate ? formattedNewEndDate : "",
  );

  // Log key values for debugging
  useEffect(() => {
    if (checkingAvailability) {
      console.log("Cubby extension check triggered with:", {
        "currentRental?.cubby_id": currentRental?.cubby_id,
        formattedCurrentEndDate,
        formattedNewEndDate,
        extensionLoading,
        extensionError,
      });
    }
  }, [
    checkingAvailability,
    currentRental,
    formattedCurrentEndDate,
    formattedNewEndDate,
    extensionLoading,
    extensionError,
  ]);

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

        // First set current rental
        setCurrentRental(data);

        // Then set the selected cubby ID after we know we have valid data
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

  useEffect(() => {
    // Fetch rental fees from system settings
    const fetchSystemSettings = async () => {
      try {
        console.log("Starting to fetch system settings for extend page...");

        // First, ensure we can connect to supabase properly
        try {
          const { data: testData, error: testError } = await supabase
            .from("system_settings")
            .select("count(*)")
            .limit(1);

          if (testError) {
            console.error("Initial test query failed:", testError);
          } else {
            console.log(
              "Successfully connected to system_settings table, count:",
              testData,
            );
          }
        } catch (testErr) {
          console.error("Exception during test query:", testErr);
        }

        // Check if rental fees exist, insert if not
        const { data: feesCheck, error: feesCheckError } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", "cubby_rental_fees")
          .maybeSingle();

        if (feesCheckError) {
          console.error("Error checking rental fees:", feesCheckError);
        } else if (!feesCheck) {
          // Fees don't exist, insert them
          console.log("Rental fees don't exist, inserting default...");

          const { error: insertError } = await supabase
            .from("system_settings")
            .insert({
              setting_key: "cubby_rental_fees",
              setting_value: {
                weekly: 10,
                monthly: 35,
                quarterly: 90,
              },
              description: "Cubby rental fees for different time periods",
            });

          if (insertError) {
            console.error("Error inserting rental fees:", insertError);
          } else {
            console.log("Successfully inserted rental fees");
          }
        }

        // Also check if commission rates exist and insert if not - for consistency
        const { data: commCheck, error: commCheckError } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", "commission_rates")
          .maybeSingle();

        if (commCheckError) {
          console.error("Error checking commission rates:", commCheckError);
        } else if (!commCheck) {
          // Commission rates don't exist, insert them
          console.log("Commission rates don't exist, inserting default...");

          const { error: insertError } = await supabase
            .from("system_settings")
            .insert({
              setting_key: "commission_rates",
              setting_value: {
                self_listed: 15,
                staff_listed: 25,
              },
              description: "Commission rates for seller items",
            });

          if (insertError) {
            console.error("Error inserting commission rates:", insertError);
          } else {
            console.log("Successfully inserted commission rates");
          }
        }

        // Check if shop open days exist and insert if not
        const { data: openDaysCheck, error: openDaysCheckError } =
          await supabase
            .from("system_settings")
            .select("id")
            .eq("setting_key", "shop_open_days")
            .maybeSingle();

        if (openDaysCheckError) {
          console.error("Error checking shop open days:", openDaysCheckError);
        } else if (!openDaysCheck) {
          // Shop open days don't exist, insert them
          console.log("Shop open days don't exist, inserting default...");

          const { error: insertError } = await supabase
            .from("system_settings")
            .insert({
              setting_key: "shop_open_days",
              setting_value: {
                monday: true,
                tuesday: true,
                wednesday: true,
                thursday: true,
                friday: true,
                saturday: true,
                sunday: false,
              },
              description: "Days when the shop is open for business",
            });

          if (insertError) {
            console.error("Error inserting shop open days:", insertError);
          } else {
            console.log("Successfully inserted shop open days");
          }
        }

        // Fetch rental fees
        console.log("Fetching rental fees...");
        const { data: rentalFeesData, error: rentalFeesError } = await supabase
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "cubby_rental_fees")
          .single();

        if (rentalFeesError) {
          console.error("Error fetching rental fees:", rentalFeesError);
          // Continue with default values
        } else if (rentalFeesData?.setting_value) {
          console.log("Rental fees fetched:", rentalFeesData.setting_value);
          // Ensure we have all required properties
          const fees = {
            weekly: rentalFeesData.setting_value.weekly || 10,
            monthly: rentalFeesData.setting_value.monthly || 35,
            quarterly: rentalFeesData.setting_value.quarterly || 90,
          };

          console.log("Rental fees set to:", fees);
          setRentalFees(fees);
        }

        // Fetch shop open days settings
        try {
          console.log("Fetching shop open days settings...");
          const { data: openDaysData, error: openDaysError } = await supabase
            .from("system_settings")
            .select("setting_value")
            .eq("setting_key", "shop_open_days")
            .single();

          if (openDaysError) {
            console.error(
              "Error fetching shop open days settings:",
              openDaysError,
            );
            // Continue with default values
          } else if (openDaysData?.setting_value) {
            console.log(
              "Shop open days settings fetched:",
              openDaysData.setting_value,
            );

            const shopOpenDays = {
              monday:
                openDaysData.setting_value.monday !== undefined
                  ? openDaysData.setting_value.monday
                  : true,
              tuesday:
                openDaysData.setting_value.tuesday !== undefined
                  ? openDaysData.setting_value.tuesday
                  : true,
              wednesday:
                openDaysData.setting_value.wednesday !== undefined
                  ? openDaysData.setting_value.wednesday
                  : true,
              thursday:
                openDaysData.setting_value.thursday !== undefined
                  ? openDaysData.setting_value.thursday
                  : true,
              friday:
                openDaysData.setting_value.friday !== undefined
                  ? openDaysData.setting_value.friday
                  : true,
              saturday:
                openDaysData.setting_value.saturday !== undefined
                  ? openDaysData.setting_value.saturday
                  : true,
              sunday:
                openDaysData.setting_value.sunday !== undefined
                  ? openDaysData.setting_value.sunday
                  : false,
            };

            console.log("Shop open days settings set to:", shopOpenDays);
            setOpenDays(shopOpenDays);
          }
        } catch (openDaysErr) {
          console.error(
            "Exception fetching shop open days settings:",
            openDaysErr,
          );
          // Continue with default values
        }

        // Try an alternative approach if needed - fetch all settings at once
        try {
          console.log("Fetching all settings as backup...");
          const { data: allSettings, error: allSettingsError } = await supabase
            .from("system_settings")
            .select("setting_key, setting_value");

          if (allSettingsError) {
            console.error("Error fetching all settings:", allSettingsError);
          } else if (allSettings && allSettings.length > 0) {
            console.log("All settings fetched:", allSettings);

            // Look for rental fees in all settings
            const rentalFeeSetting = allSettings.find(
              (s) => s.setting_key === "cubby_rental_fees",
            );
            if (rentalFeeSetting && rentalFeeSetting.setting_value) {
              const fees = {
                weekly: rentalFeeSetting.setting_value.weekly || 10,
                monthly: rentalFeeSetting.setting_value.monthly || 35,
                quarterly: rentalFeeSetting.setting_value.quarterly || 90,
              };
              console.log("Setting rental fees from backup:", fees);
              setRentalFees(fees);
            }

            // Look for shop open days in all settings
            const openDaysSetting = allSettings.find(
              (s) => s.setting_key === "shop_open_days",
            );
            if (openDaysSetting && openDaysSetting.setting_value) {
              const shopOpenDays = {
                monday:
                  openDaysSetting.setting_value.monday !== undefined
                    ? openDaysSetting.setting_value.monday
                    : true,
                tuesday:
                  openDaysSetting.setting_value.tuesday !== undefined
                    ? openDaysSetting.setting_value.tuesday
                    : true,
                wednesday:
                  openDaysSetting.setting_value.wednesday !== undefined
                    ? openDaysSetting.setting_value.wednesday
                    : true,
                thursday:
                  openDaysSetting.setting_value.thursday !== undefined
                    ? openDaysSetting.setting_value.thursday
                    : true,
                friday:
                  openDaysSetting.setting_value.friday !== undefined
                    ? openDaysSetting.setting_value.friday
                    : true,
                saturday:
                  openDaysSetting.setting_value.saturday !== undefined
                    ? openDaysSetting.setting_value.saturday
                    : true,
                sunday:
                  openDaysSetting.setting_value.sunday !== undefined
                    ? openDaysSetting.setting_value.sunday
                    : false,
              };
              console.log("Setting shop open days from backup:", shopOpenDays);
              setOpenDays(shopOpenDays);
            }
          }
        } catch (allErr) {
          console.error("Exception fetching all settings:", allErr);
        }
      } catch (err) {
        console.error("Error fetching system settings:", err);
        // Keep default values if there's an error
      }
    };

    fetchSystemSettings();
  }, [supabase]);

  const handleRentalPeriodChange = (value: string) => {
    // Reset UI state when changing rental period
    if (showCubbyOptions) {
      setShowCubbyOptions(false);
      setCheckingAvailability(false); // Reset the hook trigger as well
      if (currentRental) {
        setSelectedCubbyId(currentRental.cubby_id);
      }
      setSuccessMessage(null);
    }

    // Then update rental period
    if (value === rentalPeriod) {
      setRentalPeriod(null);
    } else if (value) {
      setRentalPeriod(value);
    }
  };

  const handleCheckAvailability = () => {
    if (!rentalPeriod) {
      setError("Please select a rental period first");
      return;
    }

    // Clear any previous errors
    setError(null);

    // First make sure we have a valid cubby ID selected for extension
    if (!selectedCubbyId && currentRental) {
      setSelectedCubbyId(currentRental.cubby_id);
    }

    // Validate that we have all required data before proceeding
    if (
      !currentRental ||
      !currentRental.cubby_id ||
      !formattedCurrentEndDate ||
      !formattedNewEndDate
    ) {
      console.error("Missing required data for availability check:", {
        "currentRental?.cubby_id": currentRental?.cubby_id,
        formattedCurrentEndDate,
        formattedNewEndDate,
      });
      setError("Unable to check availability: missing rental data");
      return;
    }

    console.log("Starting availability check with:", {
      cubbyId: currentRental.cubby_id,
      currentEndDate: formattedCurrentEndDate,
      newEndDate: formattedNewEndDate,
    });

    // Then set UI state
    setShowCubbyOptions(true);

    // Use setTimeout with a small delay to ensure state updates are processed
    // before triggering the availability check
    setTimeout(() => {
      setCheckingAvailability(true);
    }, 50);
  };

  const handleExtendRental = async () => {
    if (
      !currentRental ||
      !selectedCubbyId ||
      !calculatedNewEndDate ||
      !rentalPeriod
    )
      return;

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
      // Pass the additional fee as a parameter to ensure correct fee calculation
      setTimeout(() => {
        router.push(
          `/dashboard/seller/cubby/payment?rental_id=${currentRental.id}&extended=true&additional_fee=${rentalFees[rentalPeriod as keyof typeof rentalFees]}`,
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
        <LayoutWrapper>
          <MainContent className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rental details...</p>
            </div>
          </MainContent>
        </LayoutWrapper>
      </SellerGuard>
    );
  }

  if (error) {
    return (
      <SellerGuard>
        <LayoutWrapper>
          <MainContent>
            <div className="container mx-auto px-4 py-8">
              <Card className="max-w-md mx-auto">
                <CardContent className="pt-6 text-center">
                  <div className="text-red-500 mb-4 text-lg">
                    Error: {error}
                  </div>
                  <Button
                    onClick={() => router.push("/dashboard/seller/cubby")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to My Cubby
                  </Button>
                </CardContent>
              </Card>
            </div>
          </MainContent>
        </LayoutWrapper>
      </SellerGuard>
    );
  }

  return (
    <SellerGuard>
      <LayoutWrapper>
        <MainContent>
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
                          value={rentalPeriod === null ? "" : rentalPeriod}
                          onValueChange={(value: string) => {
                            handleRentalPeriodChange(value);
                          }}
                          className="space-y-4"
                        >
                          <div
                            className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "weekly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                          >
                            <RadioGroupItem
                              value="weekly"
                              id="weekly"
                              className="sr-only"
                            />
                            <Label
                              htmlFor="weekly"
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    Weekly Extension
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Add 7 open shop days
                                  </p>
                                </div>
                                <p
                                  className={`font-medium ${rentalPeriod === "weekly" ? "text-pink-600" : ""}`}
                                >
                                  {formatPrice(rentalFees.weekly)}
                                </p>
                              </div>
                            </Label>
                          </div>

                          <div
                            className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "monthly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                          >
                            <RadioGroupItem
                              value="monthly"
                              id="monthly"
                              className="sr-only"
                            />
                            <Label
                              htmlFor="monthly"
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    Monthly Extension
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Add 30 open shop days
                                  </p>
                                </div>
                                <p
                                  className={`font-medium ${rentalPeriod === "monthly" ? "text-pink-600" : ""}`}
                                >
                                  {formatPrice(rentalFees.monthly)}
                                </p>
                              </div>
                            </Label>
                          </div>

                          <div
                            className={`flex items-center space-x-2 border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "quarterly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                          >
                            <RadioGroupItem
                              value="quarterly"
                              id="quarterly"
                              className="sr-only"
                            />
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
                                    Add 90 open shop days
                                  </p>
                                </div>
                                <p
                                  className={`font-medium ${rentalPeriod === "quarterly" ? "text-pink-600" : ""}`}
                                >
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
                          {rentalPeriod ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-pink-600" />
                                <p className="text-lg font-medium">
                                  {calculatedNewEndDate?.toLocaleDateString() ||
                                    ""}
                                </p>
                              </div>
                              <p className="text-xs text-pink-600">
                                <strong>Duration:</strong>{" "}
                                {rentalPeriod === "weekly"
                                  ? "7"
                                  : rentalPeriod === "monthly"
                                    ? "30"
                                    : "90"}{" "}
                                open shop days ({calendarDays} calendar days)
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500">
                              <p className="text-sm italic">
                                Please select a rental period
                              </p>
                            </div>
                          )}
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
                              {rentalPeriod
                                ? formatPrice(
                                    rentalFees[
                                      rentalPeriod as keyof typeof rentalFees
                                    ],
                                  )
                                : "--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-pink-600 hover:bg-pink-700"
                      onClick={handleExtendRental}
                      disabled={
                        isSubmitting ||
                        !showCubbyOptions ||
                        !selectedCubbyId ||
                        !rentalPeriod ||
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
        </MainContent>
      </LayoutWrapper>
    </SellerGuard>
  );
}

// Main component wrapped in Suspense
export default function ExtendCubbyPage() {
  return (
    <Suspense fallback={null}>
      <ExtendCubbyInner />
    </Suspense>
  );
}
