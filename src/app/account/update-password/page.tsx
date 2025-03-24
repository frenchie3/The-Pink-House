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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-6">
          <div className="bg-pink-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Set new password</h1>
          <p className="text-muted-foreground">
            Your new password must be different from previously used passwords
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
} 