import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import UpdatePasswordForm from "./update-password-form";

/**
 * This page is only accessible after a user has clicked a valid password reset link
 * A valid session must exist after token verification for this page to work
 */
export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  // If no session exists, redirect to the forgot password page
  // This prevents users from accessing this page directly without a valid reset token
  if (!session) {
    redirect("/forgot-password?error=Invalid+or+expired+session.+Please+request+a+new+password+reset+link.");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create New Password</h1>
          <p className="text-muted-foreground">
            Please create a new, secure password for your account
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
} 