import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const isSuccess = searchParams?.type === "success";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar showDashboard={false} />
      <main className="flex-1 flex items-center justify-center bg-background px-4 py-8">
        {isSuccess ? (
          <Card className="w-full max-w-md shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="rounded-full bg-green-50 p-4">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Check your email
                  </h2>
                  <p className="text-muted-foreground">
                    {searchParams.message || "We've sent you a password reset link. Please check your email."}
                  </p>
                </div>
                <Link
                  href="/sign-in"
                  className="text-sm text-primary hover:underline"
                >
                  Return to sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight text-center">
                  Reset Your Password
                </h1>
                <p className="text-sm text-muted-foreground text-center">
                  Enter your email and we'll send you a password reset link
                </p>
              </CardHeader>
              <CardContent>
                <form
                  action={forgotPasswordAction}
                  method="POST"
                  className="flex flex-col space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      className="w-full"
                    />
                  </div>

                  <SubmitButton
                    pendingText="Sending reset link..."
                    className="w-full"
                  >
                    Send Reset Link
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
        )}
      </main>
    </div>
  );
} 