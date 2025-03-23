import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");

  console.log("Auth callback received:", { code, next, type });

  if (code) {
    try {
      const supabase = await createClient();
      
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL(
            `/sign-in?type=error&message=Authentication failed. Please try again.`,
            requestUrl.origin
          )
        );
      }

      console.log("Code exchange successful:", data);
      
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

      // If this is a password recovery
      if (type === "recovery") {
        // Redirect to the reset password page
        return NextResponse.redirect(
          new URL("/protected/reset-password", requestUrl.origin)
        );
      }

      // If no type specified, assume it's a password reset
      return NextResponse.redirect(
        new URL("/protected/reset-password", requestUrl.origin)
      );
    } catch (error) {
      console.error("Error in auth callback:", error);
      return NextResponse.redirect(
        new URL(
          `/sign-in?type=error&message=Authentication failed. Please try again.`,
          requestUrl.origin
        )
      );
    }
  }

  // If no code provided, redirect to sign in with error
  return NextResponse.redirect(
    new URL(
      `/sign-in?type=error&message=Invalid authentication request.`,
      requestUrl.origin
    )
  );
} 