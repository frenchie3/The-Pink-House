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

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  console.log(`Initiating password reset for ${email} with redirect to ${origin}/auth/callback`);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error("Password reset error:", error.message);
      return encodedRedirect(
        "error",
        "/forgot-password",
        `Could not reset password: ${error.message}`
      );
    }

    return encodedRedirect(
      "success",
      "/forgot-password",
      "Check your email for a link to reset your password."
    );
  } catch (error) {
    console.error("Unexpected error in forgotPasswordAction:", error);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "An unexpected error occurred. Please try again."
    );
  }
};

export const resetPasswordAction = async (formData: FormData) => {
  try {
    const supabase = await createClient();
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const code = formData.get("code") as string;

    console.log("Processing password reset with code", { hasCode: !!code });

    if (!password || !confirmPassword) {
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Password and confirm password are required"
      );
    }

    if (password !== confirmPassword) {
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Passwords do not match"
      );
    }

    if (!code) {
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Missing reset code. Please request a new password reset link."
      );
    }

    // First exchange the code for a session
    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError.message);
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        `Authentication failed: ${exchangeError.message}`
      );
    }
    
    if (!exchangeData.session) {
      console.error("No session returned after code exchange");
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        "Unable to authenticate. Please request a new password reset link."
      );
    }

    // Now update the password
    console.log("Updating password for user", exchangeData.user?.id);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      console.error("Password update failed:", updateError.message);
      return encodedRedirect(
        "error",
        "/protected/reset-password",
        `Password update failed: ${updateError.message}`
      );
    }

    console.log("Password updated successfully");
    return encodedRedirect(
      "success",
      "/sign-in",
      "Password has been updated successfully. Please sign in with your new password."
    );
  } catch (error: any) {
    console.error("Unexpected error in resetPasswordAction:", error);
    const errorMessage = error.message || "An unexpected error occurred";
    return encodedRedirect(
      "error",
      "/protected/reset-password",
      `Error: ${errorMessage}`
    );
  }
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};
