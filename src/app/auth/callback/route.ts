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
    type: type || 'null'
  });

  if (!code) {
    console.error("No code parameter found in auth callback URL");
    return NextResponse.redirect(
      new URL("/sign-in?type=error&message=Missing authentication code. Please try again.", requestUrl.origin)
    );
  }

  // Handle password recovery type - always prioritize this flow
  if (type === "recovery") {
    console.log("Password recovery detected, redirecting to reset password page with code");
    return NextResponse.redirect(
      new URL(`/protected/reset-password?code=${code}`, requestUrl.origin)
    );
  }

  try {
    const supabase = await createClient();
    
    // For the email confirmation flow, try to exchange the code
    if (type === "signup") {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error("Error exchanging signup code for session:", error.message);
        return NextResponse.redirect(
          new URL(`/sign-in?type=error&message=Email confirmation failed: ${error.message}`, requestUrl.origin)
        );
      }
      
      if (!data.session) {
        console.error("No session returned after signup code exchange");
        return NextResponse.redirect(
          new URL("/sign-in?type=error&message=Email confirmation failed. Please try again.", requestUrl.origin)
        );
      }
      
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
    
    // Default case - exchange code and redirect to dashboard or home
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Error exchanging code for session:", error.message);
      return NextResponse.redirect(
        new URL(`/sign-in?type=error&message=Authentication failed: ${error.message}`, requestUrl.origin)
      );
    }
  } catch (e) {
    console.error("Unexpected error in auth callback:", e);
    return NextResponse.redirect(
      new URL("/sign-in?type=error&message=An unexpected error occurred. Please try again.", requestUrl.origin)
    );
  }

  // For other auth callbacks or successful exchanges without specific types
  return NextResponse.redirect(new URL(next || "/", requestUrl.origin));
} 