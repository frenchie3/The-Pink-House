"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Save,
  Package,
  DollarSign,
  CreditCard,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { SettingsForm } from "@/components/admin/settings-form";
import { createClient } from "../../../../../supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

// Inner component that uses useSearchParams
function AdminSettingsInner() {
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [itemLimits, setItemLimits] = useState({ default: 10, premium: 20 });
  const [commRates, setCommRates] = useState({ self_listed: 15, staff_listed: 25 });
  const [rentalFees, setRentalFees] = useState({
    weekly: 10,
    monthly: 35,
    quarterly: 90,
  });
  const [unsoldSettings, setUnsoldSettings] = useState({
    gracePickupDays: 7,
    lastChanceDays: 3,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [rawSettingsData, setRawSettingsData] = useState<any[]>([]);
  const [openDays, setOpenDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: false,
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const supabase = createClient();

  // Extract success message from URL if present
  useEffect(() => {
    const successMsg = searchParams.get("success");
    if (successMsg) {
      setSuccessMessage(successMsg);
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Define fetchSettings as a function
  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // Fetch settings
      const { data, error } = await supabase
        .from("system_settings")
        .select("id, setting_key, setting_value, description")
        .order("setting_key", { ascending: true });

      if (error) throw error;
      setSystemSettings(data || []);

      // Find specific settings
      const cubbyItemLimits = data?.find(
        (setting) => setting.setting_key === "cubby_item_limits",
      );
      const commissionRates = data?.find(
        (setting) => setting.setting_key === "commission_rates",
      );
      const cubbyRentalFees = data?.find(
        (setting) => setting.setting_key === "cubby_rental_fees",
      );
      const unsoldSettingsData = data?.find(
        (setting) => setting.setting_key === "unsold_settings",
      );

      // Parse settings for UI display
      setItemLimits(
        cubbyItemLimits?.setting_value || { default: 10, premium: 20 },
      );
      
      // For commission rates, make sure we handle both percentage and decimal formats consistently
      if (commissionRates?.setting_value) {
        const selfRate = commissionRates.setting_value.self_listed || 15;
        const staffRate = commissionRates.setting_value.staff_listed || 25;
        
        // No need to normalize for display in admin - we want to show the actual percentage values
        setCommRates({
          self_listed: selfRate,
          staff_listed: staffRate
        });
      } else {
        setCommRates({ self_listed: 15, staff_listed: 25 });
      }
      
      setRentalFees(
        cubbyRentalFees?.setting_value || {
          weekly: 10,
          monthly: 35,
          quarterly: 90,
        },
      );
      setUnsoldSettings(
        unsoldSettingsData?.setting_value || {
          gracePickupDays: 7,
          lastChanceDays: 3,
        },
      );

      // Also get the raw data for diagnostic purposes
      const { data: rawSettingsData, error: rawError } = await supabase
        .from("system_settings")
        .select("*");
      
      if (rawError) {
        console.error("Error fetching raw settings data:", rawError);
      } else {
        console.log("Raw settings data:", rawSettingsData);
        // Set to state for diagnostic display
        setRawSettingsData(rawSettingsData || []);
      }

      // Load open days
      const openDaysSetting = data?.find(
        (setting) => setting.setting_key === "shop_open_days",
      );
      if (openDaysSetting) {
        setOpenDays(openDaysSetting.setting_value);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side form submission handler
  const handleUpdateSettings = async (formData: FormData) => {
    try {
      const settingKey = formData.get("setting_key") as string;
      const settingValue = formData.get("setting_value") as string;

      // Parse the JSON value
      const parsedValue = JSON.parse(settingValue);

      // Update the setting
      const { error } = await supabase
        .from("system_settings")
        .update({
          setting_value: parsedValue,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", settingKey);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh the page with success message
      router.push(
        "/dashboard/admin/settings?success=Settings updated successfully",
      );
    } catch (error) {
      console.error("Error updating settings:", error);
      router.push(
        `/dashboard/admin/settings?error=${encodeURIComponent(error instanceof Error ? error.message : "Failed to update settings")}`,
      );
    }
  };

  // Add saveOpenDays function
  const saveOpenDays = async (openDaysSettings: { [key: string]: boolean }): Promise<void> => {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          {
            setting_key: "shop_open_days",
            setting_value: openDaysSettings,
            description: "Days when the charity shop is open for business",
          },
          { onConflict: "setting_key" }
        );

      if (error) throw error;

      fetchSettings(); // Refresh settings after save
    } catch (error) {
      console.error("Error saving open days settings:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["admin"]}>
        <div className="flex flex-col h-screen">
          <DashboardNavbar />
          <main className="flex-1 bg-gray-50 overflow-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading settings...</p>
            </div>
          </main>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col h-screen">
        <DashboardNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  System Settings
                </h1>
                <p className="text-gray-600 mt-1">
                  Configure your shop's operational parameters and business
                  rules
                </p>
              </div>

              {/* Header buttons removed */}
            </header>

            {/* Notification Messages */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Settings Overview Card */}
            <Card className="mb-8 bg-gradient-to-r from-pink-50 to-white border-pink-100">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-pink-100 p-3 rounded-full">
                      <Package className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Item Limit (Default)
                      </p>
                      <p className="text-2xl font-bold">
                        {itemLimits.default} items
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-pink-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Commission Rate
                      </p>
                      <p className="text-2xl font-bold">
                        {commRates.self_listed}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="bg-pink-100 p-3 rounded-full">
                      <CreditCard className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Monthly Rental Fee
                      </p>
                      <p className="text-2xl font-bold">
                        ${rentalFees.monthly}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Settings Tabs */}
            <Tabs defaultValue="cubby_limits" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger
                  value="cubby_limits"
                  className="flex items-center gap-2"
                >
                  <Package size={16} />
                  <span>Inventory Limits</span>
                </TabsTrigger>
                <TabsTrigger
                  value="commission_rates"
                  className="flex items-center gap-2"
                >
                  <DollarSign size={16} />
                  <span>Commission Rates</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rental_fees"
                  className="flex items-center gap-2"
                >
                  <CreditCard size={16} />
                  <span>Rental Pricing</span>
                </TabsTrigger>
                <TabsTrigger
                  value="unsold_settings"
                  className="flex items-center gap-2"
                >
                  <Clock size={16} />
                  <span>End of Rental</span>
                </TabsTrigger>
                <TabsTrigger
                  value="opendays"
                  className="flex items-center gap-2"
                >
                  <Clock size={16} />
                  <span>Open Days</span>
                </TabsTrigger>
              </TabsList>

              {/* Use the client component for all settings forms */}
              <SettingsForm
                updateSettings={handleUpdateSettings}
                itemLimits={itemLimits}
                commRates={commRates}
                rentalFees={rentalFees}
                pickupSettings={unsoldSettings}
              />
            </Tabs>

            {/* Diagnostic Section - for admins to debug system settings */}
            <div className="mt-8 border-t pt-8">
              <h2 className="text-xl font-bold mb-4">System Settings Diagnostics</h2>
              <p className="text-gray-600 mb-4">
                This section shows the raw data from the system_settings table for debugging purposes.
              </p>
              
              <div className="space-y-4">
                {rawSettingsData.map((setting) => (
                  <Card key={setting.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 py-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="font-mono text-pink-600">{setting.setting_key}</span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded text-gray-700">
                          ID: {setting.id.substring(0, 8)}...
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {setting.description || "No description provided"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                      <div className="bg-gray-50 p-3 rounded overflow-auto max-h-48">
                        <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                          {JSON.stringify(setting.setting_value, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 py-2 px-4 text-xs text-gray-500 flex justify-between">
                      <span>Created: {new Date(setting.created_at).toLocaleString()}</span>
                      <span>Updated: {new Date(setting.updated_at).toLocaleString()}</span>
                    </CardFooter>
                  </Card>
                ))}

                {rawSettingsData.length === 0 && (
                  <div className="p-8 text-center border rounded-lg">
                    <p className="text-gray-500">No system settings found in database!</p>
                    <Button 
                      className="mt-4 bg-pink-600 hover:bg-pink-700"
                      onClick={async () => {
                        try {
                          // Insert default settings
                          await supabase.from("system_settings").insert([
                            {
                              setting_key: "commission_rates",
                              setting_value: { self_listed: 15, staff_listed: 25 },
                              description: "Commission rates for seller items"
                            },
                            {
                              setting_key: "cubby_rental_fees",
                              setting_value: { weekly: 10, monthly: 35, quarterly: 90 },
                              description: "Cubby rental fees for different time periods"
                            },
                            {
                              setting_key: "unsold_settings",
                              setting_value: { gracePickupDays: 7, lastChanceDays: 3 },
                              description: "Settings for end of rental unsold item handling"
                            },
                            {
                              setting_key: "cubby_item_limits",
                              setting_value: { default: 10, premium: 20 },
                              description: "Maximum number of items a seller can add to their cubby based on their plan"
                            },
                            {
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
                              description: "Days when the charity shop is open for business"
                            }
                          ]);
                          
                          // Refresh the page
                          router.push("/dashboard/admin/settings?success=Default settings created successfully");
                        } catch (error) {
                          console.error("Error creating default settings:", error);
                        }
                      }}
                    >
                      Create Default Settings
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Open Days Settings */}
            <OpenDaysSettings 
              settings={openDays} 
              onSave={saveOpenDays} 
            />
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}

// Add the OpenDaysSettings component below the existing settings components
function OpenDaysSettings({ 
  settings, 
  onSave 
}: { 
  settings: { [key: string]: boolean }, 
  onSave: (settings: { [key: string]: boolean }) => Promise<void> 
}) {
  const [openDays, setOpenDays] = useState<{ [key: string]: boolean }>(settings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (day: string) => {
    setOpenDays({
      ...openDays,
      [day]: !openDays[day],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(openDays);
      toast({
        title: "Settings updated",
        description: "Shop open days have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving open days settings:", error);
      toast({
        title: "Error",
        description: "Failed to update open days settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Shop Open Days</CardTitle>
        <CardDescription>
          Configure which days the charity shop is open. Cubby rental periods will be adjusted to only count open days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
              <div key={day} className="flex items-center space-x-2">
                <Checkbox 
                  id={`open-${day}`} 
                  checked={openDays[day] || false}
                  onCheckedChange={() => handleToggle(day)}
                />
                <label
                  htmlFor={`open-${day}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                >
                  {day}
                </label>
              </div>
            ))}
          </div>
          
          <div className="pt-4">
            <Button 
              type="submit" 
              className="bg-pink-600 hover:bg-pink-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Open Days"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Main component wrapped in Suspense
export default function AdminSettingsPage() {
  return (
    <Suspense fallback={null}>
      <AdminSettingsInner />
    </Suspense>
  );
}
