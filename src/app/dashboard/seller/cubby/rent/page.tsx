"use client";

import { useState, useEffect } from "react";
import { useCubbyAvailability } from "@/hooks/use-cubby-availability";
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
  Store,
} from "lucide-react";
import { formatPrice, calculateOpenDaysEndDate, getShopOpenDays, ShopOpenDays } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../../../supabase/client";
import { Input } from "@/components/ui/input";
import AvailableCubbies from "@/components/seller/available-cubbies";
import RentalPeriodInfo from "@/components/seller/rental-period-info";

export default function RentCubbyPage() {
  const [rentalPeriod, setRentalPeriod] = useState<string | null>(null);
  const [listingType, setListingType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [availableCubbies, setAvailableCubbies] = useState<any[]>([]);
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopOpenDays, setShopOpenDays] = useState<ShopOpenDays | null>(null);
  const [calculatedEndDate, setCalculatedEndDate] = useState<Date | null>(null);
  const [openDaysCount, setOpenDaysCount] = useState<number>(0);
  const [calendarDaysCount, setCalendarDaysCount] = useState<number>(0);

  // State for unsold items preference - no default selection
  const [pickupPreference, setPickupPreference] = useState<string | null>(null);

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

  // Set default start date to today and fetch shop open days
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    setStartDate(formattedDate);
    
    // Fetch shop open days configuration
    const fetchOpenDays = async () => {
      try {
        const openDaysConfig = await getShopOpenDays();
        setShopOpenDays(openDaysConfig);
      } catch (err) {
        console.error("Error fetching shop open days:", err);
      }
    };
    
    fetchOpenDays();
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
                self_listed: 15,
                staff_listed: 25
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
            // Handle different possible naming variations for backward compatibility
            // Also handle percentages stored as whole numbers (e.g., 15 instead of 0.15)
            const selfRate = commissionData.setting_value.self_listed || 
                  commissionData.setting_value.self || 
                  commissionData.setting_value.default || 15;
                  
            const staffRate = commissionData.setting_value.staff_listed || 
                   commissionData.setting_value.staff || 
                   commissionData.setting_value.premium || 25;
            
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
                  self: setting.setting_value.self_listed || 
                        setting.setting_value.self || 
                        setting.setting_value.default || 15,
                  staff: setting.setting_value.staff_listed || 
                        setting.setting_value.staff || 
                        setting.setting_value.premium || 25,
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

  // Calculate end date based on start date and rental period (calendar days)
  const calculateEndDateCalendar = (start: string, period: string) => {
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

  // Calculate end date string based on start date and rental period (calendar days)
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
  
  // Calculate end date based on open days
  useEffect(() => {
    const calculateEndDateWithOpenDays = async () => {
      if (!startDate || !rentalPeriod) {
        setCalculatedEndDate(null);
        setOpenDaysCount(0);
        setCalendarDaysCount(0);
        return;
      }
      
      try {
        // Get the number of open days based on rental period
        let openDays = 0;
        if (rentalPeriod === "weekly") {
          openDays = 7;
        } else if (rentalPeriod === "monthly") {
          openDays = 30;
        } else if (rentalPeriod === "quarterly") {
          openDays = 90;
        }
        
        // Calculate the end date based on open days
        const startDateObj = new Date(startDate);
        const endDate = await calculateOpenDaysEndDate(startDateObj, openDays);
        
        // Calculate calendar days
        const calendarDays = Math.ceil((endDate.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000)) + 1;
        
        setCalculatedEndDate(endDate);
        setOpenDaysCount(openDays);
        setCalendarDaysCount(calendarDays);
      } catch (err) {
        console.error("Error calculating end date with open days:", err);
        // Fallback to calendar days calculation
        const endDateStr = calculateEndDateString(startDate, rentalPeriod);
        setCalculatedEndDate(new Date(endDateStr));
      }
    };
    
    calculateEndDateWithOpenDays();
  }, [startDate, rentalPeriod]);
  
  // Get the calculated end date string for the availability hook
  const calculatedEndDateString = calculatedEndDate ? calculatedEndDate.toISOString().split("T")[0] : "";

  // Use the cubby availability hook at the component level
  const {
    availableCubbies: fetchedCubbies,
    loading: cubbiesLoading,
    error: cubbiesError,
  } = useCubbyAvailability(startDate, calculatedEndDateString);

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

      if (!rentalPeriod) {
        throw new Error("Please select a rental period");
      }

      if (!listingType) {
        throw new Error("Please select a listing type");
      }

      if (!pickupPreference) {
        throw new Error("Please select an unsold items preference");
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

      // Use the calculated end date that accounts for open days
      const startDateObj = new Date(startDate);
      const endDateObj = calculatedEndDate || new Date(calculateEndDateCalendar(startDate, rentalPeriod));
      
      // Calculate grace period date (days after rental expires)
      const gracePeriodDateObj = new Date(endDateObj);
      gracePeriodDateObj.setDate(gracePeriodDateObj.getDate() + systemSettings.gracePickupDays);
      
      // Calculate editable until date (days AFTER rental expires, not before)
      const editableUntilDateObj = new Date(endDateObj);
      editableUntilDateObj.setDate(editableUntilDateObj.getDate() + systemSettings.lastChanceDays);
      
      console.log("Rental period:", {
        start: startDateObj.toISOString(),
        end: endDateObj.toISOString(),
        gracePeriodEnd: gracePeriodDateObj.toISOString(),
        editableUntil: editableUntilDateObj.toISOString()
      });

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
          unsold_option: pickupPreference, // Store the seller's unsold items preference
          
          // Keep the timestamp fields that do exist in the database
          grace_period_date: gracePeriodDateObj.toISOString(),
          editable_until_date: editableUntilDateObj.toISOString()
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