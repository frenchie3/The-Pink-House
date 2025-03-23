import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");
  
  console.log("Auth callback received:", { code: code?.substring(0, 5) + "...", type, url: requestUrl.toString() });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL("/sign-in?type=error&message=Authentication failed. Please try again.", requestUrl.origin)
      );
    }
    
    // If this is an email confirmation
    if (type === "signup") {
      // Update the email_verified status in the users table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ email_verified: true })
          .eq("id", user.id);
      }
      
      // Redirect to sign-in with success message
      return NextResponse.redirect(
        new URL(
          "/sign-in?type=success&message=Email confirmed successfully. Please sign in.",
          requestUrl.origin
        )
      );
    }

    // Handle password reset flow
    if (code && !type) {
      console.log("Password reset flow detected, redirecting to reset password page");
      return NextResponse.redirect(
        new URL("/protected/reset-password", requestUrl.origin)
      );
    }
  }

  // For other auth callbacks
  return NextResponse.redirect(new URL(next || "/", requestUrl.origin));
} 