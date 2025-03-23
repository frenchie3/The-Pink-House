import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    
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
        new URL(next || "/protected/reset-password", requestUrl.origin)
      );
    }
  }

  // For other auth callbacks
  return NextResponse.redirect(new URL(next || "/", requestUrl.origin));
} 