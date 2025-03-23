import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      // If there's an error, redirect to sign-in with error message
      return NextResponse.redirect(
        new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }

    // After successful code exchange, redirect to sign-in for password reset
    return NextResponse.redirect(new URL("/sign-in", requestUrl.origin));
  }

  // If no code, redirect to dashboard
  return NextResponse.redirect(new URL(next, requestUrl.origin));
} 