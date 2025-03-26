import { NextRequest, NextResponse } from "next/server";
import { updateInventoryItemAsStaff } from "@/app/actions/inventory-actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await updateInventoryItemAsStaff(formData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in staff update-inventory API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
} 