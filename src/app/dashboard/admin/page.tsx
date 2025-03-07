import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  Settings,
  Users,
  ShoppingBag,
  Package,
  CreditCard,
  Cog,
  Bell,
  Database,
} from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch summary data
  const { data: userCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });

  const { data: inventoryCount } = await supabase
    .from("inventory_items")
    .select("id", { count: "exact", head: true });

  const { data: salesCount } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true });

  const { data: cubbyCount } = await supabase
    .from("cubbies")
    .select("id", { count: "exact", head: true });

  // Fetch system settings
  const { data: systemSettings } = await supabase
    .from("system_settings")
    .select("*");

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Manage system settings, users, and operations
              </p>
            </div>

            <div className="flex gap-2">
              <Button className="bg-pink-600 hover:bg-pink-700">
                <Settings className="mr-2 h-5 w-5" />
                System Settings
              </Button>
              <Button variant="outline">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
              </Button>
            </div>
          </header>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {userCount?.count || 0}
                  </div>
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Inventory Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {inventoryCount?.count || 0}
                  </div>
                  <Package className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {salesCount?.count || 0}
                  </div>
                  <ShoppingBag className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Cubbies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">
                    {cubbyCount?.count || 0}
                  </div>
                  <CreditCard className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="settings">System Settings</TabsTrigger>
              <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Database Status
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Healthy
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Last Backup</span>
                        <span className="text-sm text-gray-500">
                          Today, 03:45 AM
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          System Version
                        </span>
                        <span className="text-sm text-gray-500">v1.2.0</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto py-4 justify-start"
                      >
                        <Users className="mr-2 h-5 w-5 text-pink-600" />
                        <div className="text-left">
                          <div className="font-medium">Manage Users</div>
                          <div className="text-xs text-gray-500">
                            Add, edit, or remove users
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 justify-start"
                      >
                        <Database className="mr-2 h-5 w-5 text-pink-600" />
                        <div className="text-left">
                          <div className="font-medium">Backup Data</div>
                          <div className="text-xs text-gray-500">
                            Create system backup
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 justify-start"
                      >
                        <Cog className="mr-2 h-5 w-5 text-pink-600" />
                        <div className="text-left">
                          <div className="font-medium">Commission Rates</div>
                          <div className="text-xs text-gray-500">
                            Adjust seller fees
                          </div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 justify-start"
                      >
                        <BarChart3 className="mr-2 h-5 w-5 text-pink-600" />
                        <div className="text-left">
                          <div className="font-medium">Sales Report</div>
                          <div className="text-xs text-gray-500">
                            Generate monthly report
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemSettings?.map((setting) => (
                      <div
                        key={setting.id}
                        className="border-b pb-4 last:border-0 last:pb-0"
                      >
                        <h3 className="font-medium text-gray-900">
                          {setting.setting_key}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {setting.description}
                        </p>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(setting.setting_value, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Button className="bg-pink-600 hover:bg-pink-700">
                    <Users className="mr-2 h-4 w-4" />
                    Add New User
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-12 text-gray-500">
                    User management interface will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-12 text-gray-500">
                    System settings interface will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center py-12 text-gray-500">
                    Reports and analytics will be displayed here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Admin Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Link
              href="/dashboard/admin/users"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-pink-100 p-3 rounded-lg mr-4">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-500">
                  Manage user accounts and permissions
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/settings"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-pink-100 p-3 rounded-lg mr-4">
                <Settings className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">System Settings</h3>
                <p className="text-sm text-gray-500">
                  Configure system parameters
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/admin/reports"
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center"
            >
              <div className="bg-pink-100 p-3 rounded-lg mr-4">
                <BarChart3 className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Reports & Analytics
                </h3>
                <p className="text-sm text-gray-500">
                  View detailed system reports
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </RoleGuard>
  );
}
