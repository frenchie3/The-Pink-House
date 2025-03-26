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

    // Get the current state of the items
    const { data: items, error: fetchError } = await supabase
      .from("inventory_items")
      .select("id, editing_locked")
      .in("id", itemIds);

    if (fetchError) {
      console.error("Error fetching items:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch items" },
        { status: 500 }
      );
    }

    // Separate items into locked and unlocked
    const lockedItemIds = items.filter(item => item.editing_locked).map(item => item.id);
    const unlockedItemIds = items.filter(item => !item.editing_locked).map(item => item.id);
    
    let totalUpdated = 0;
    
    // Update locked items (just set labels_printed=true)
    if (lockedItemIds.length > 0) {
      const { data: lockedData, error: lockedError } = await supabase
        .from("inventory_items")
        .update({ labels_printed: true })
        .in("id", lockedItemIds)
        .select();
        
      if (lockedError) {
        console.error("Error updating locked items:", lockedError);
        return NextResponse.json(
          { error: "Failed to update locked items" },
          { status: 500 }
        );
      }
      
      totalUpdated += lockedData?.length || 0;
    }
    
    // Update unlocked items (set both labels_printed=true and editing_locked=true)
    if (unlockedItemIds.length > 0) {
      const { data: unlockedData, error: unlockedError } = await supabase
        .from("inventory_items")
        .update({ 
          labels_printed: true,
          editing_locked: true 
        })
        .in("id", unlockedItemIds)
        .select();
        
      if (unlockedError) {
        console.error("Error updating unlocked items:", unlockedError);
        return NextResponse.json(
          { error: "Failed to update unlocked items" },
          { status: 500 }
        );
      }
      
      totalUpdated += unlockedData?.length || 0;
    }

    return NextResponse.json({
      success: true,
      message: `${totalUpdated} items updated successfully`,
      locked: lockedItemIds.length,
      unlocked: unlockedItemIds.length
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 