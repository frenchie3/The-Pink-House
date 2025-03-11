import { NextRequest, NextResponse } from "next/server";
import { processSale } from "@/app/actions/sales-actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await processSale(formData);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in process-sale API route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
