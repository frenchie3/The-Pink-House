import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import POSInterface from "@/components/pos/pos-interface";

export default async function POSPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch inventory items
  const { data: inventoryItems } = await supabase
    .from("inventory_items")
    .select("*")
    .order("date_added", { ascending: false });

  // Fetch categories for filtering
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <POSInterface
          inventoryItems={inventoryItems || []}
          categories={categories || []}
          userId={user.id}
        />
      </main>
    </>
  );
}
