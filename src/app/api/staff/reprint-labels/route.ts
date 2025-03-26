import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { itemIds } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: "No item IDs provided" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify user authentication and permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user role to verify they are staff or admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData || !["staff", "admin"].includes(userData.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Mark items as having labels printed (but don't change the editing_locked status)
    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        labels_printed: true,
      })
      .in("id", itemIds)
      .select();

    if (error) {
      console.error("Error updating items:", error);
      return NextResponse.json(
        { error: "Failed to update items" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Labels reprinted for ${data.length} items successfully`,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 