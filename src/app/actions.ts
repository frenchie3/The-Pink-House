"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || "";
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  // Password validation
  const passwordValidation = [
    { isValid: password.length >= 8, message: "Password must be at least 8 characters long" },
    { isValid: /[A-Z]/.test(password), message: "Password must contain at least one uppercase letter" },
    { isValid: /[a-z]/.test(password), message: "Password must contain at least one lowercase letter" },
    { isValid: /[0-9]/.test(password), message: "Password must contain at least one number" }
  ];
  
  const failedValidation = passwordValidation.find(rule => !rule.isValid);
  if (failedValidation) {
    return encodedRedirect(
      "error",
      "/sign-up",
      failedValidation.message
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?type=signup`,
      data: {
        full_name: fullName,
        email: email,
      },
    },
  });

  console.log("After signUp", error);

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  if (user) {
    try {
      const { error: updateError } = await supabase.from("users").insert({
        id: user.id,
        name: fullName,
        full_name: fullName,
        email: email,
        user_id: user.id,
        token_identifier: user.id,
        role: "seller",
        created_at: new Date().toISOString(),
        listing_preference: "self",
        commission_rate: 0.15,
      });

      if (updateError) {
        console.error("Error updating user profile:", updateError);
      }
    } catch (err) {
      console.error("Error in user profile creation:", err);
    }
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  // Check if email is verified
  if (authData.user) {
    const { data: userData } = await supabase
      .from("users")
      .select("email_verified")
      .eq("id", authData.user.id)
      .single();

    if (!userData?.email_verified) {
      // Sign out the user since they're not verified
      await supabase.auth.signOut();
      return encodedRedirect(
        "warning",
        "/sign-in",
        "Please verify your email before signing in. Need a new verification email?"
      );
    }

    // Get user role to redirect to the appropriate dashboard
    const { data: roleData } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (roleData?.role) {
      // Redirect based on role
      switch (roleData.role) {
        case "admin":
          return redirect("/dashboard/admin");
        case "staff":
          return redirect("/dashboard/staff");
        case "seller":
          return redirect("/dashboard/seller");
        default:
          // Fallback to general dashboard if role is unknown
          return redirect("/dashboard");
      }
    }
  }

  // Fallback to general dashboard if we couldn't determine the role
  return redirect("/dashboard");
};

export const resendVerificationEmail = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email) {
    return encodedRedirect("error", "/sign-in", "Email is required");
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    }
  });

  if (error) {
    console.error("Error resending verification email:", error);
    return encodedRedirect(
      "error",
      "/sign-in",
      "Failed to resend verification email. Please try again."
    );
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Verification email has been resent. Please check your inbox."
  );
};

// Simple in-memory rate limiting for password reset attempts
// This will reset when the server restarts, but provides basic protection
const resetAttempts = new Map<string, { count: number, lastAttempt: number }>();

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const clientIp = headers().get("x-forwarded-for") || "unknown";

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  // Implement rate limiting to prevent abuse
  const key = `${clientIp}:${email.toLowerCase()}`;
  const now = Date.now();
  const attempt = resetAttempts.get(key) || { count: 0, lastAttempt: 0 };

  // Allow 3 attempts per 30 minutes per IP+email combination
  const rateLimit = 3;
  const cooldownPeriod = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Reset count if cooldown period has passed
  if (now - attempt.lastAttempt > cooldownPeriod) {
    attempt.count = 0;
  }

  if (attempt.count >= rateLimit) {
    const timeRemaining = Math.ceil((attempt.lastAttempt + cooldownPeriod - now) / 60000); // minutes
    return encodedRedirect(
      "error",
      "/forgot-password",
      `Too many requests. Please try again in ${timeRemaining} minutes.`
    );
  }

  // Update rate limit tracking
  attempt.count += 1;
  attempt.lastAttempt = now;
  resetAttempts.set(key, attempt);

  // Use the new /auth/confirm endpoint for token exchange following PKCE flow
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=/account/update-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  // Redirect to the check-email page with the email address
  return redirect(`/check-email?email=${encodeURIComponent(email)}`);
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();
  
  // Check for valid session before allowing password reset
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Your session has expired. Please request a new password reset link."
    );
  }
  
  // Check if session is still valid
  // Supabase session contains an expires_at timestamp in seconds
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  
  if (sessionData.session.expires_at && now > sessionData.session.expires_at) {
    // Force session expiry for security
    await supabase.auth.signOut();
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Your password reset link has expired. Please request a new one."
    );
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Passwords do not match",
    );
  }

  // Enhanced password validation on server-side
  const passwordValidation = [
    { isValid: password.length >= 8, message: "Password must be at least 8 characters long" },
    { isValid: /[A-Z]/.test(password), message: "Password must contain at least one uppercase letter" },
    { isValid: /[a-z]/.test(password), message: "Password must contain at least one lowercase letter" },
    { isValid: /[0-9]/.test(password), message: "Password must contain at least one number" }
  ];
  
  const failedValidation = passwordValidation.find(rule => !rule.isValid);
  if (failedValidation) {
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      failedValidation.message
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    // Log error without exposing sensitive details to the user
    console.error("Password update error:", error.message);
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password update failed. Please try again."
    );
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Password has been updated successfully. Please sign in with your new password.",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
