import { createClient } from "../../../../supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const type = requestUrl.searchParams.get("type");
  
  console.log("Auth callback received:", { 
    url: requestUrl.toString(),
    code: code ? `${code.substring(0, 5)}...` : 'null', 
    type: type || 'null',
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  if (!code) {
    console.error("No code parameter found in auth callback URL");
    return NextResponse.redirect(
      new URL("/sign-in?type=error&message=Missing authentication code. Please try again.", requestUrl.origin)
    );
  }

  // Special handling for password reset
  // Either the password-reset flag is set or type is recovery
  if (requestUrl.toString().includes("password-reset=true") || type === "recovery") {
    console.log("Password reset detected, redirecting to reset password page with code");
    
    // For password reset, add code as a query param to the reset page
    return NextResponse.redirect(
      new URL(`/protected/reset-password?code=${code}`, requestUrl.origin)
    );
  }

  // For the email confirmation and other flows, try to exchange the code
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log("Exchange code result:", { 
      success: !error, 
      errorMessage: error?.message,
      hasSession: !!data?.session,
      user: data?.user ? `${data.user.id} (${data.user.email})` : 'null'
    });
    
    if (error) {
      console.error("Error exchanging code for session:", error.message, error.stack);
      return NextResponse.redirect(
        new URL(`/sign-in?type=error&message=Authentication failed: ${error.message}`, requestUrl.origin)
      );
    }
    
    if (!data.session) {
      console.error("No session returned after code exchange");
      return NextResponse.redirect(
        new URL("/sign-in?type=error&message=Unable to create session. Please try again.", requestUrl.origin)
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
  } catch (e) {
    console.error("Unexpected error in auth callback:", e);
    return NextResponse.redirect(
      new URL("/sign-in?type=error&message=An unexpected error occurred. Please try again.", requestUrl.origin)
    );
  }

  // For other auth callbacks
  return NextResponse.redirect(new URL(next || "/", requestUrl.origin));
} 