import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { createClient } from "../../../../../supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminCubbiesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch all cubbies with optimized fields selection
  const { data: cubbies } = await supabase
    .from("cubbies")
    .select("id, cubby_number, location, status, updated_at")
    .order("cubby_number", { ascending: true });

  // Fetch active rentals with a join to get only necessary user fields
  const { data: activeRentals } = await supabase
    .from("cubby_rentals")
    .select(
      "id, cubby_id, end_date, seller_id, seller:users(full_name, name, email)",
    )
    .eq("status", "active");

  // Create a map of cubby_id to rental info for easier lookup
  const rentalMap = new Map();
  activeRentals?.forEach((rental) => {
    rentalMap.set(rental.cubby_id, rental);
  });

  // Import the server actions at the top level
  const { toggleCubbyStatus, deleteCubby } = await import(
    "@/app/actions/cubby-actions"
  );

  return (
    <>
      <div className="flex flex-col h-screen">
        <DashboardNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Cubby Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Add, edit, or deactivate cubbies for seller rentals
                </p>
              </div>

              <Link href="/dashboard/admin/cubbies/add">
                <Button className="bg-pink-600 hover:bg-pink-700">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add New Cubby
                </Button>
              </Link>
            </header>

            {/* Cubby Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Total Cubbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {cubbies?.length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Available Cubbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {cubbies?.filter((c) => c.status === "available").length ||
                      0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">
                    Occupied Cubbies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {activeRentals?.length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cubbies Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Cubbies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Cubby Number
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Location
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Current Renter
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Rental End Date
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cubbies?.map((cubby) => {
                        const rental = rentalMap.get(cubby.id);
                        const isRented = !!rental;
                        const renterName = isRented
                          ? rental.seller?.full_name ||
                            rental.seller?.name ||
                            "Unknown"
                          : "—";
                        const endDate = isRented
                          ? new Date(rental.end_date).toLocaleDateString(
                              "en-NZ",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )
                          : "—";

                        return (
                          <tr
                            key={cubby.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 font-medium">
                              {cubby.cubby_number}
                            </td>
                            <td className="py-3 px-4">
                              {cubby.location || "Main Floor"}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cubby.status === "available"
                                    ? "bg-green-100 text-green-800"
                                    : cubby.status === "occupied"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {cubby.status.charAt(0).toUpperCase() +
                                  cubby.status.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">{renterName}</td>
                            <td className="py-3 px-4">{endDate}</td>
                            <td className="py-3 px-4">
                              <div className="flex space-x-2">
                                <Link
                                  href={`/dashboard/admin/cubbies/edit/${cubby.id}`}
                                >
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={isRented}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>

                                <form action={toggleCubbyStatus}>
                                  <input
                                    type="hidden"
                                    name="cubby_id"
                                    value={cubby.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="current_status"
                                    value={cubby.status}
                                  />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-600 hover:text-gray-900"
                                    disabled={isRented}
                                  >
                                    {cubby.status === "available" ? (
                                      <XCircle className="h-4 w-4 text-amber-600" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                </form>

                                <form action={deleteCubby}>
                                  <input
                                    type="hidden"
                                    name="cubby_id"
                                    value={cubby.id}
                                  />
                                  <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-900"
                                    disabled={isRented}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}
