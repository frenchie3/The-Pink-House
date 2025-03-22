import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

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
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form
            action={resetPasswordAction}
            method="POST"
            className="flex flex-col space-y-6"
          >
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">
                Set New Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  New Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton
              pendingText="Updating password..."
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              Reset Password
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
        </div>
      </div>
    </>
  );
}
