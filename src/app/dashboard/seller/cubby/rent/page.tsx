"use client";

import { useState, useEffect } from "react";
import { useCubbyAvailability } from "@/hooks/use-cubby-availability";
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

  // State for unsold items preference - default to pickup option
  const [pickupPreference, setPickupPreference] = useState("pickup");

  // System settings for grace period - fetched from system_settings table
  // Default values used as fallback if settings are not found
  const [systemSettings, setSystemSettings] = useState({
    gracePickupDays: 7, // Default: 7 days grace period for pickup after rental expires
    lastChanceDays: 3, // Default: 3 days before expiration when seller can change preference
  });

  // Rental fee structure - will be dynamically updated from system settings
  const [rentalFees, setRentalFees] = useState({
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  });

  const router = useRouter();
  const supabase = createClient();

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
    // First, ensure the settings exist in the database
    const ensureSettingsExist = async () => {
      try {
        console.log("Ensuring system settings exist...");
        
        // Check if unsold_settings exists
        const { data: unsoldCheck, error: unsoldCheckError } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", "unsold_settings")
          .maybeSingle();
          
        if (unsoldCheckError) {
          console.error("Error checking unsold settings:", unsoldCheckError);
        } else if (!unsoldCheck) {
          // Settings don't exist, try to insert them
          console.log("Unsold settings don't exist, inserting default...");
          
          const { error: insertError } = await supabase
            .from("system_settings")
            .insert({
              setting_key: "unsold_settings",
              setting_value: {
                gracePickupDays: 7,
                lastChanceDays: 3
              },
              description: "Settings for end of rental unsold item handling"
            });
            
          if (insertError) {
            console.error("Error inserting unsold settings:", insertError);
          } else {
            console.log("Successfully inserted unsold settings");
          }
        }
        
        // Check if rental fees exist
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
                quarterly: 90
              },
              description: "Cubby rental fees for different time periods"
            });
            
          if (insertError) {
            console.error("Error inserting rental fees:", insertError);
          } else {
            console.log("Successfully inserted rental fees");
          }
        }
        
        // Check if commission rates exist
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
                default: 0.15,
                staff: 0.25
              },
              description: "Commission rates for seller items"
            });
            
          if (insertError) {
            console.error("Error inserting commission rates:", insertError);
          } else {
            console.log("Successfully inserted commission rates");
          }
        }
        
      } catch (err) {
        console.error("Error ensuring settings exist:", err);
      }
    };
    
    // Run this first to ensure we have the data
    ensureSettingsExist().then(() => {
      // After ensuring data exists, fetch the settings
      fetchSystemSettings();
    });
    
    // Fetch commission rates and other system settings
    const fetchSystemSettings = async () => {
      try {
        console.log("Starting to fetch system settings...");
        
        // First, ensure we can connect to supabase properly
        try {
          const { data: testData, error: testError } = await supabase
            .from("system_settings")
            .select("count(*)")
            .limit(1);
            
          if (testError) {
            console.error("Initial test query failed:", testError);
          } else {
            console.log("Successfully connected to system_settings table, count:", testData);
          }
        } catch (testErr) {
          console.error("Exception during test query:", testErr);
        }
        
        // Commission rates logic update to handle different formats
        try {
          console.log("Fetching commission rates...");
          const { data: commissionData, error: commissionError } = await supabase
            .from("system_settings")
            .select("setting_value")
            .eq("setting_key", "commission_rates")
            .single();

          if (commissionError) {
            console.error("Error fetching commission rates:", commissionError);
            // Continue with default values
          } else if (commissionData && commissionData.setting_value) {
            console.log("Commission rates fetched:", commissionData.setting_value);
            
            // Map database values to state
            // Handle different possible naming variations in the database
            // Also handle percentages stored as whole numbers (e.g., 15 instead of 0.15)
            const selfRate = commissionData.setting_value.self || 
                  commissionData.setting_value.self_listed || 
                  commissionData.setting_value.default || 0.15;
                  
            const staffRate = commissionData.setting_value.staff || 
                   commissionData.setting_value.staff_listed || 
                   commissionData.setting_value.premium || 0.25;
            
            // Convert percentages if needed (if > 1, assume it's a percentage like 15 instead of 0.15)
            const normalizedSelfRate = selfRate > 1 ? selfRate / 100 : selfRate;
            const normalizedStaffRate = staffRate > 1 ? staffRate / 100 : staffRate;
            
            const commRates = {
              self: normalizedSelfRate,
              staff: normalizedStaffRate
            };
            
            console.log("Commission rates set to:", commRates);
            setCommissionRates(commRates);
          }
        } catch (commErr) {
          console.error("Exception fetching commission rates:", commErr);
        }

        // Fetch rental fees
        try {
          console.log("Fetching rental fees...");
          const { data: rentalFeesData, error: rentalFeesError } =
            await supabase
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
        } catch (rentalFeesErr) {
          console.error("Exception fetching rental fees:", rentalFeesErr);
          // Continue with default values
        }

        // Fetch unsold settings (if they exist)
        try {
          console.log("Fetching unsold settings...");
          const { data: unsoldSettingsData, error: unsoldSettingsError } =
            await supabase
              .from("system_settings")
              .select("setting_value")
              .eq("setting_key", "unsold_settings")
              .single();

          if (unsoldSettingsError) {
            console.error(
              "Error fetching unsold settings:",
              unsoldSettingsError,
            );
            // Continue with default values
          } else if (unsoldSettingsData?.setting_value) {
            console.log(
              "Unsold settings fetched:",
              unsoldSettingsData.setting_value,
            );
            
            const unsoldSettings = {
              gracePickupDays:
                unsoldSettingsData.setting_value.gracePickupDays || 7,
              lastChanceDays:
                unsoldSettingsData.setting_value.lastChanceDays || 3,
            };
            
            console.log("Unsold settings set to:", unsoldSettings);
            setSystemSettings(unsoldSettings);
          }
        } catch (unsoldErr) {
          console.error("Exception fetching unsold settings:", unsoldErr);
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
            
            // Process each setting separately
            for (const setting of allSettings) {
              console.log(`Processing setting: ${setting.setting_key}`, setting.setting_value);
              
              if (setting.setting_key === "commission_rates" && !commissionRates.self) {
                const commRates = {
                  self: setting.setting_value.self || 
                        setting.setting_value.self_listed || 
                        setting.setting_value.default || 0.15,
                  staff: setting.setting_value.staff || 
                        setting.setting_value.staff_listed || 
                        setting.setting_value.premium || 0.25,
                };
                console.log("Setting commission rates from backup:", commRates);
                setCommissionRates(commRates);
              }
              
              if (setting.setting_key === "cubby_rental_fees") {
                const fees = {
                  weekly: setting.setting_value.weekly || 10,
                  monthly: setting.setting_value.monthly || 35,
                  quarterly: setting.setting_value.quarterly || 90,
                };
                console.log("Setting rental fees from backup:", fees);
                setRentalFees(fees);
              }
              
              if (setting.setting_key === "unsold_settings") {
                const unsoldSettings = {
                  gracePickupDays: setting.setting_value.gracePickupDays || 7,
                  lastChanceDays: setting.setting_value.lastChanceDays || 3,
                };
                console.log("Setting unsold settings from backup:", unsoldSettings);
                setSystemSettings(unsoldSettings);
              }
            }
          }
        } catch (allErr) {
          console.error("Exception fetching all settings:", allErr);
        }
        
      } catch (err) {
        console.error("Error in fetchSystemSettings:", err);
        // Keep default values if there's an error
      }
    };

    // Initial fetch happens within the ensureSettingsExist chain
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

  // Use the cubby availability hook at the component level
  const {
    availableCubbies: fetchedCubbies,
    loading: cubbiesLoading,
    error: cubbiesError,
  } = useCubbyAvailability(startDate, calculatedEndDate);

  // Update local state when fetched cubbies change
  useEffect(() => {
    if (fetchedCubbies && fetchedCubbies.length > 0) {
      setAvailableCubbies(fetchedCubbies);
    }
  }, [fetchedCubbies]);

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
          unsold_preference: pickupPreference, // Store the seller's unsold items preference
          grace_period_days: systemSettings.gracePickupDays, // Store the grace period days for tracking
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
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-pink-600 mr-2"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              Rent Your Cubby Space
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rental Options */}
            <div className="lg:col-span-2">
              <Card className="shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-lg sr-only">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-pink-600 mr-2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="21" x2="9" y2="9" />
                    </svg>
                    Cubby Rental Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="period" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                      <TabsTrigger value="period">Rental Period</TabsTrigger>
                      <TabsTrigger value="cubby">Select Cubby</TabsTrigger>
                      <TabsTrigger value="listing">Listing Type</TabsTrigger>
                      <TabsTrigger value="pickup">Unsold Options</TabsTrigger>
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
                            Rental start date
                          </p>
                        </div>

                        <h3 className="text-sm font-medium mt-4">
                          Rental Period
                        </h3>
                        <RadioGroup
                          value={rentalPeriod}
                          onValueChange={setRentalPeriod}
                          className="space-y-4"
                        >
                          <div
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "weekly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                            onClick={() => setRentalPeriod("weekly")}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Weekly Rental</p>
                                <p className="text-sm text-gray-500">
                                  7 days access to your cubby
                                </p>
                              </div>
                              <p
                                className={`font-medium ${rentalPeriod === "weekly" ? "text-pink-600" : ""}`}
                              >
                                {formatPrice(rentalFees.weekly)}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "monthly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                            onClick={() => setRentalPeriod("monthly")}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Monthly Rental</p>
                                <p className="text-sm text-gray-500">
                                  30 days access to your cubby
                                </p>
                              </div>
                              <p
                                className={`font-medium ${rentalPeriod === "monthly" ? "text-pink-600" : ""}`}
                              >
                                {formatPrice(rentalFees.monthly)}
                              </p>
                            </div>
                          </div>

                          <div
                            className={`border p-4 rounded-lg cursor-pointer transition-all ${rentalPeriod === "quarterly" ? "bg-pink-50 border-pink-200 shadow-sm" : "hover:bg-gray-50 border-gray-200"}`}
                            onClick={() => setRentalPeriod("quarterly")}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">Quarterly Rental</p>
                                <p className="text-sm text-gray-500">
                                  90 days access to your cubby
                                </p>
                              </div>
                              <p
                                className={`font-medium ${rentalPeriod === "quarterly" ? "text-pink-600" : ""}`}
                              >
                                {formatPrice(rentalFees.quarterly)}
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>
                    </TabsContent>

                    <TabsContent value="cubby" className="space-y-6">
                      <div className="space-y-4">
                        {startDate ? (
                          <>
                            <div className="bg-pink-50 p-3 rounded-lg text-pink-800 mb-4">
                              <p className="text-sm">
                                <strong>Rental:</strong>{" "}
                                {new Date(startDate).toLocaleDateString()} to{" "}
                                {new Date(
                                  calculatedEndDate,
                                ).toLocaleDateString()}
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
                        <h3 className="text-sm font-medium mb-4">
                          Listing Preference
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Self-Listing Option */}
                          <div
                            className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${listingType === "self" ? "border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-white shadow-md" : "border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"}`}
                            onClick={() => setListingType("self")}
                          >
                            <div
                              className="p-6 flex flex-col"
                              style={{ minHeight: "320px" }}
                            >
                              <div className="flex items-start mb-4">
                                <div className="mr-4 p-3 rounded-full bg-pink-100">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-600"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold">
                                    Self-Listing
                                  </h4>
                                  <p className="text-gray-500 text-sm mt-1">
                                    You manage your own listings
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3 flex-grow">
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`${listingType === "self" ? "text-pink-500" : "text-gray-500"} mr-2 mt-0.5`}
                                  >
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    Set your own prices and descriptions
                                  </p>
                                </div>
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`${listingType === "self" ? "text-pink-500" : "text-gray-500"} mr-2 mt-0.5`}
                                  >
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    Lower commission rate
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    Commission Rate:
                                  </span>
                                  <span
                                    className={`text-lg font-semibold ${listingType === "self" ? "text-pink-600" : "text-gray-600"}`}
                                  >
                                    {commissionRates.self * 100}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Staff-Managed Option */}
                          <div
                            className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${listingType === "staff" ? "border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-white shadow-md" : "border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"}`}
                            onClick={() => setListingType("staff")}
                          >
                            <div
                              className="p-6 flex flex-col"
                              style={{ minHeight: "320px" }}
                            >
                              <div className="flex items-start mb-4">
                                <div className="mr-4 p-3 rounded-full bg-pink-100">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-600"
                                  >
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold">
                                    Staff-Managed
                                  </h4>
                                  <p className="text-pink-600 text-sm mt-1 font-medium">
                                    Let us handle everything
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3 flex-grow">
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-500 mr-2 mt-0.5"
                                  >
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    Save time and hassle—just drop off items
                                  </p>
                                </div>
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-500 mr-2 mt-0.5"
                                  >
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    Optimal pricing for maximum sales
                                  </p>
                                </div>
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-500 mr-2 mt-0.5"
                                  >
                                    <polyline points="9 11 12 14 22 4" />
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                  </svg>
                                  <p className="text-sm text-gray-600">
                                    Professional descriptions
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    Commission Rate:
                                  </span>
                                  <span
                                    className={`text-lg font-semibold ${listingType === "staff" ? "text-pink-600" : "text-gray-600"}`}
                                  >
                                    {commissionRates.staff * 100}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="16" x2="12" y2="12" />
                              <line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <p className="text-xs text-blue-800">
                              <strong>Note:</strong> Preference cannot be
                              changed after rental
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Unsold Options Tab */}
                    <TabsContent value="pickup" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium mb-4">
                          What would you like us to do with any unsold items
                          after your rental expires?
                        </h3>

                        <RadioGroup
                          value={pickupPreference}
                          onValueChange={setPickupPreference}
                          className="space-y-4"
                        >
                          {/* Pickup Option */}
                          <div
                            className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${pickupPreference === "pickup" ? "border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-white shadow-md" : "border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"}`}
                            onClick={() => setPickupPreference("pickup")}
                          >
                            <div className="p-6">
                              <div className="flex items-start mb-4">
                                <div className="mr-4 p-3 rounded-full bg-pink-100">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-600"
                                  >
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold">
                                    I'll collect my unsold items
                                  </h4>
                                  <p className="text-pink-600 text-sm mt-1 font-medium">
                                    within {systemSettings.gracePickupDays} days
                                    after my rental expires
                                  </p>
                                </div>
                              </div>

                              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-blue-500 mr-2 mt-0.5 flex-shrink-0"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                  <div>
                                    <p className="text-sm text-blue-800">
                                      <strong>Grace Period:</strong> Based on
                                      our current policy, you'll have{" "}
                                      {systemSettings.gracePickupDays} days
                                      after your rental expires to collect your
                                      items.
                                    </p>
                                    <p className="text-xs text-blue-700 mt-2">
                                      You can modify this preference up to{" "}
                                      {systemSettings.lastChanceDays} days
                                      before your rental expires.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Donate Option */}
                          <div
                            className={`relative overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${pickupPreference === "donate" ? "border-2 border-pink-500 bg-gradient-to-br from-pink-50 to-white shadow-md" : "border border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white"}`}
                            onClick={() => setPickupPreference("donate")}
                          >
                            <div className="p-6">
                              <div className="flex items-start mb-4">
                                <div className="mr-4 p-3 rounded-full bg-pink-100">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-pink-600"
                                  >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold">
                                    Donate my unsold items
                                  </h4>
                                  <p className="text-gray-500 text-sm mt-1">
                                    Items will be donated to charity
                                  </p>
                                </div>
                              </div>

                              <div className="bg-amber-50 p-4 rounded-lg mt-4">
                                <div className="flex items-start">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-amber-500 mr-2 mt-0.5 flex-shrink-0"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                  </svg>
                                  <div>
                                    <p className="text-sm text-amber-800">
                                      <strong>Note:</strong> By selecting this
                                      option, you agree to donate any unsold
                                      items to our partner charities after your
                                      rental expires.
                                    </p>
                                    <p className="text-xs text-amber-700 mt-2">
                                      You can modify this preference up to{" "}
                                      {systemSettings.lastChanceDays} days
                                      before your rental expires.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </RadioGroup>

                        <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-start">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                            >
                              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                            <div>
                              <p className="text-xs text-gray-600">
                                <strong>Business Logic:</strong> When your
                                rental expires, the system will track the status
                                of your unsold items based on your selection. If
                                you choose to collect your items, they'll be
                                marked as "pending pickup" for the grace period.
                                You'll receive notifications as the expiration
                                date approaches.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-4 bg-white">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="flex items-center text-base">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-pink-600 mr-2"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    Rental Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                      <h3 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-pink-600" />
                        Rental Period
                      </h3>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {rentalPeriod.charAt(0).toUpperCase() +
                            rentalPeriod.slice(1)}
                        </p>
                        {startDate && (
                          <p className="text-xs text-gray-600 mt-0.5">
                            {new Date(startDate).toLocaleDateString()} to{" "}
                            {new Date(
                              calculateEndDate(startDate, rentalPeriod),
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                      <h3 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 text-pink-600"
                        >
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                        Selected Cubby
                      </h3>
                      {selectedCubby ? (
                        <div className="flex items-center gap-2">
                          <div className="bg-pink-100 p-2 rounded-full">
                            <CheckCircle2 className="h-4 w-4 text-pink-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            Cubby #
                            {availableCubbies.find(
                              (c) => c.id === selectedCubby,
                            )?.cubby_number || ""}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="16" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                          <p className="text-sm italic">
                            Please select a cubby
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                      <h3 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 text-pink-600"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Listing Preference
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-pink-100">
                          <CheckCircle2 className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {listingType === "self"
                              ? "Self-Listing"
                              : "Staff-Managed"}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {listingType === "self"
                              ? "You manage listings"
                              : "Staff manages listings"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm">
                      <h3 className="text-xs font-medium text-gray-700 mb-1 flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="mr-1 text-pink-600"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Unsold Items Preference
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-full bg-pink-100">
                          <CheckCircle2 className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {pickupPreference === "pickup"
                              ? "I'll collect my items"
                              : "Donate unsold items"}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {pickupPreference === "pickup"
                              ? `${systemSettings.gracePickupDays} day grace period`
                              : "Items will be donated"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6 mt-2">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 text-gray-400"
                          >
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <path d="M7 15h0M12 15h0" />
                          </svg>
                          Rental Fee:
                        </span>
                        <span className="font-medium text-sm">
                          {formatPrice(
                            rentalFees[rentalPeriod as keyof typeof rentalFees],
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="mr-2 text-gray-400"
                          >
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                          </svg>
                          Commission Rate:
                        </span>
                        <span className="font-medium text-sm">
                          {(commissionRates[
                            listingType as keyof typeof commissionRates
                          ] * 100).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-4 pt-3 border-t bg-pink-50 p-3 rounded-lg shadow-sm">
                        <span className="text-sm font-medium">
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
                    className="w-full bg-pink-600 hover:bg-pink-700 transition-all shadow-md py-5"
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
                        Rent Cubby
                      </>
                    )}
                  </Button>
                  <p className="text-center text-gray-500 text-xs mt-2">
                    Secure payment • Instant confirmation
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
