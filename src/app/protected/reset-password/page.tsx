import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { session }, error } = await supabase.auth.getSession();
  
  console.log("Reset password page - Session check:", { 
    hasSession: !!session, 
    error: error?.message 
  });
  
  if (error || !session) {
    console.error("Session error:", error);
    return redirect("/sign-in?type=error&message=Please request a new password reset link.");
  }

  if ("message" in searchParams) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Reset Your Password
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Please enter your new password below
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={resetPasswordAction}
              method="POST"
              className="flex flex-col space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your new password"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm New Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>

              <SubmitButton
                pendingText="Updating password..."
                className="w-full"
              >
                Update Password
              </SubmitButton>

              <FormMessage message={searchParams} />

              <div className="text-center text-sm">
                <Link
                  href="/sign-in"
                  className="text-primary font-medium hover:underline transition-all"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
