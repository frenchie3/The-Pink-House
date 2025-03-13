import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import POSClientInterface from "@/components/pos/pos-client-interface";
import { LayoutWrapper, MainContent } from "@/components/layout-wrapper";

export default async function POSPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch categories for filtering - this is small data that can be passed to client
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <LayoutWrapper>
      <DashboardNavbar />
      <MainContent>
        <POSClientInterface categories={categories || []} userId={user.id} />
      </MainContent>
    </LayoutWrapper>
  );
}
