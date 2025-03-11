import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch only needed system settings
  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("id, setting_key, setting_value, description")
    .order("setting_key", { ascending: true });

  // Find specific settings
  const cubbyItemLimits = systemSettings?.find(
    (setting) => setting.setting_key === "cubby_item_limits",
  );
  const commissionRates = systemSettings?.find(
    (setting) => setting.setting_key === "commission_rates",
  );
  const cubbyRentalFees = systemSettings?.find(
    (setting) => setting.setting_key === "cubby_rental_fees",
  );

  // Handle form submission
  async function updateSettings(formData: FormData) {
    "use server";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return redirect("/sign-in");
    }

    // Get form data
    const settingKey = formData.get("setting_key") as string;
    const settingValue = formData.get("setting_value") as string;

    try {
      // Parse the JSON value
      const parsedValue = JSON.parse(settingValue);

      // Update the setting
      const { error } = await supabase
        .from("system_settings")
        .update({
          setting_value: parsedValue,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", settingKey);

      if (error) {
        console.error("Error updating setting:", error);
        return redirect(
          `/dashboard/admin/settings?error=${encodeURIComponent(error.message)}`,
        );
      }

      revalidatePath("/dashboard/admin/settings");
      return redirect(
        "/dashboard/admin/settings?success=Settings updated successfully",
      );
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return redirect(
        `/dashboard/admin/settings?error=${encodeURIComponent("Invalid JSON format")}`,
      );
    }
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure system parameters and limits
              </p>
            </div>
          </header>

          {searchParams.success && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md">
              {searchParams.success}
            </div>
          )}

          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {searchParams.error}
            </div>
          )}

          <Tabs defaultValue="cubby_limits" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="cubby_limits">Cubby Item Limits</TabsTrigger>
              <TabsTrigger value="commission_rates">
                Commission Rates
              </TabsTrigger>
              <TabsTrigger value="rental_fees">Rental Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="cubby_limits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Cubby Item Limits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={updateSettings} className="space-y-6">
                    <input
                      type="hidden"
                      name="setting_key"
                      value="cubby_item_limits"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="cubby_limits_value">
                        Item Limits (JSON)
                      </Label>
                      <div className="text-sm text-gray-500 mb-2">
                        Configure the maximum number of items a seller can add
                        to their cubby based on their subscription plan.
                      </div>
                      <textarea
                        id="cubby_limits_value"
                        name="setting_value"
                        className="w-full h-40 px-3 py-2 rounded-md border border-gray-300 font-mono text-sm"
                        defaultValue={JSON.stringify(
                          cubbyItemLimits?.setting_value || {},
                          null,
                          2,
                        )}
                      />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 mb-4">
                      <p className="font-medium">Example format:</p>
                      <pre className="mt-1 text-xs">{`{
  "default": 10,
  "premium": 20
}`}</pre>
                    </div>
                    <Button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commission_rates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Commission Rates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={updateSettings} className="space-y-6">
                    <input
                      type="hidden"
                      name="setting_key"
                      value="commission_rates"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="commission_rates_value">
                        Commission Rates (JSON)
                      </Label>
                      <div className="text-sm text-gray-500 mb-2">
                        Configure the commission rates for seller items based on
                        their subscription plan.
                      </div>
                      <textarea
                        id="commission_rates_value"
                        name="setting_value"
                        className="w-full h-40 px-3 py-2 rounded-md border border-gray-300 font-mono text-sm"
                        defaultValue={JSON.stringify(
                          commissionRates?.setting_value || {},
                          null,
                          2,
                        )}
                      />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 mb-4">
                      <p className="font-medium">Example format:</p>
                      <pre className="mt-1 text-xs">{`{
  "default": 0.15,
  "premium": 0.10
}`}</pre>
                      <p className="mt-2">
                        Values represent percentage as decimal (0.15 = 15%)
                      </p>
                    </div>
                    <Button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rental_fees" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="mr-2 h-5 w-5" />
                    Cubby Rental Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form action={updateSettings} className="space-y-6">
                    <input
                      type="hidden"
                      name="setting_key"
                      value="cubby_rental_fees"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="rental_fees_value">
                        Rental Fees (JSON)
                      </Label>
                      <div className="text-sm text-gray-500 mb-2">
                        Configure the rental fees for cubby spaces based on
                        rental period.
                      </div>
                      <textarea
                        id="rental_fees_value"
                        name="setting_value"
                        className="w-full h-40 px-3 py-2 rounded-md border border-gray-300 font-mono text-sm"
                        defaultValue={JSON.stringify(
                          cubbyRentalFees?.setting_value || {},
                          null,
                          2,
                        )}
                      />
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 mb-4">
                      <p className="font-medium">Example format:</p>
                      <pre className="mt-1 text-xs">{`{
  "weekly": 10,
  "monthly": 35,
  "quarterly": 90
}`}</pre>
                      <p className="mt-2">Values represent currency amounts</p>
                    </div>
                    <Button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </RoleGuard>
  );
}
