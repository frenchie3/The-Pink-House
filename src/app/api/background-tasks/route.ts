import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { revalidatePath } from "next/cache";

// This API route handles background tasks that don't need to block the UI
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { task, payload } = data;

    if (task === "add_inventory_item") {
      const supabase = await createClient();
      const { error } = await supabase.from("inventory_items").insert(payload);

      if (error) {
        console.error("Background task error - add_inventory_item:", error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 },
        );
      }

      // Revalidate relevant paths
      revalidatePath("/dashboard/seller/listings");
      revalidatePath("/dashboard/inventory");

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: "Unknown task" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Background task error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
