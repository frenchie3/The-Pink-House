"use server";

import { createClient } from "../../../supabase/server";
import { revalidatePath } from "next/cache";

// Server action to toggle cubby status
export async function toggleCubbyStatus(formData: FormData) {
  const cubbyId = formData.get("cubby_id") as string;
  const currentStatus = formData.get("current_status") as string;
  const newStatus = currentStatus === "available" ? "maintenance" : "available";

  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("cubbies")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cubbyId);

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/admin/cubbies");

    return { success: true };
  } catch (error) {
    console.error("Error updating cubby status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update cubby status",
    };
  }
}

// Server action to delete cubby
export async function deleteCubby(formData: FormData) {
  const cubbyId = formData.get("cubby_id") as string;

  const supabase = await createClient();

  try {
    // Check if the cubby is currently rented
    const { data: rental } = await supabase
      .from("cubby_rentals")
      .select("*")
      .eq("cubby_id", cubbyId)
      .eq("status", "active")
      .single();

    if (rental) {
      return { success: false, error: "Cannot delete a rented cubby" };
    }

    const { error } = await supabase.from("cubbies").delete().eq("id", cubbyId);

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/admin/cubbies");

    return { success: true };
  } catch (error) {
    console.error("Error deleting cubby:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete cubby",
    };
  }
}

// Server action to add new cubby
export async function addCubby(formData: FormData) {
  const cubbyNumber = formData.get("cubby_number") as string;
  const location = formData.get("location") as string;
  const notes = formData.get("notes") as string;

  const supabase = await createClient();

  try {
    // Check if cubby number already exists
    const { data: existingCubby } = await supabase
      .from("cubbies")
      .select("id")
      .eq("cubby_number", cubbyNumber)
      .single();

    if (existingCubby) {
      return {
        success: false,
        error: "A cubby with this number already exists",
      };
    }

    const { data, error } = await supabase
      .from("cubbies")
      .insert({
        cubby_number: cubbyNumber,
        location,
        notes,
        status: "available",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) throw error;

    // Revalidate relevant paths
    revalidatePath("/dashboard/admin/cubbies");

    return { success: true, data: data[0] };
  } catch (error) {
    console.error("Error adding cubby:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add cubby",
    };
  }
}
