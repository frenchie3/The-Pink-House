"use client";

import { signInAction, resendVerificationEmail } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LoginProps {
  searchParams: Message;
}

export default function SignInPage({ searchParams }: LoginProps) {
  const [cooldown, setCooldown] = useState(0);
  const isUnverified = searchParams?.type === "warning" && searchParams.message.includes("verify your email");

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async (email: string) => {
    if (cooldown > 0) return;
    setCooldown(30); // Start 30 second cooldown
    const form = new FormData();
    form.append("email", email);
    await resendVerificationEmail(form);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar showDashboard={false} />
      <main className="flex-1 flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-4">
          {isUnverified && (
            <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
              <Mail className="h-4 w-4" />
              <AlertDescription className="flex flex-col space-y-2">
                <p>Please verify your email before signing in.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-fit text-sm"
                  onClick={() => handleResend(searchParams.message.split(" ")[0])}
                  disabled={cooldown > 0}
                >
                  {cooldown > 0 
                    ? `Resend in ${cooldown}s` 
                    : "Resend verification email"}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <form
              action={signInAction}
              method="POST"
              className="flex flex-col space-y-6"
            >
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link
                    className="text-primary font-medium hover:underline transition-all"
                    href="/sign-up"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="space-y-4">
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-all"
                      href="/forgot-password"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Your password"
                    required
                    className="w-full"
                  />
                </div>
              </div>

              <SubmitButton className="w-full" pendingText="Signing in...">
                Sign in
              </SubmitButton>

              {!isUnverified && <FormMessage message={searchParams} />}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
