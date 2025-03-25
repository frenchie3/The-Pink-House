import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { SmtpMessage } from "../smtp-message";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import PasswordInput from "./password-input";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const isSuccess = searchParams?.type === "success";

  return (
    <div className="h-screen flex flex-col">
      <Navbar showDashboard={false} showAuth={!isSuccess} />
      <main className="flex-1 flex items-center justify-center bg-background px-4">
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
                    We've sent you a verification link. Please check your email to verify your account.
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
          <>
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
              <form
                action={signUpAction}
                method="POST"
                className="flex flex-col space-y-6"
              >
                <div className="space-y-2 text-center">
                  <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      className="text-primary font-medium hover:underline transition-all"
                      href="/sign-in"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="John Doe"
                      required
                      className="w-full"
                    />
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <PasswordInput required />
                  </div>
                </div>

                <SubmitButton pendingText="Signing up..." className="w-full">
                  Sign up
                </SubmitButton>

                <FormMessage message={searchParams} />
              </form>
            </div>
            <SmtpMessage />
          </>
        )}
      </main>
    </div>
  );
}
