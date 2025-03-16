"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { SettingsForm } from "@/components/admin/settings-form";
import { createClient } from "../../../../../supabase/client";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [itemLimits, setItemLimits] = useState({ default: 10, premium: 20 });
  const [commRates, setCommRates] = useState({ default: 0.15, staff: 0.25 });
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

  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const supabase = createClient();

  useEffect(() => {
    // Check for success message in URL and set it to state
    const success = searchParams.get("success");
    if (success) {
      setSuccessMessage(success);
      // Clear success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        // Remove the success parameter from URL without full page reload
        const url = new URL(window.location.href);
        url.searchParams.delete("success");
        router.replace(url.pathname + url.search, { scroll: false });
      }, 5000);
      return () => clearTimeout(timer);
    }

    async function fetchSettings() {
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
        setCommRates(
          commissionRates?.setting_value || { default: 0.15, staff: 0.25 },
        );
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
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [supabase, router, searchParams]);

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
                        {(commRates.default * 100).toFixed(0)}%
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
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
