"use client";

import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { resetPasswordAction } from "@/app/actions";
import { useState, useEffect } from 'react';

export default function ResetPassword({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  // Basic state management for loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Safely extract params
  const code = typeof searchParams?.code === 'string' ? searchParams.code : null;
  const message = typeof searchParams?.message === 'string' ? searchParams.message : null;
  const type = typeof searchParams?.type === 'string' ? searchParams.type : null;

  useEffect(() => {
    // Simple loading effect
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // Log code existence for debugging
    console.log("Reset password page loaded with code:", !!code);
    
    return () => clearTimeout(timer);
  }, [code]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent mx-auto"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show message if present
  if (message && type) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4 sm:max-w-md">
        <div className={`w-full rounded-lg border ${type === 'error' ? 'border-destructive' : 'border-green-500'} bg-card p-6 shadow-sm text-center`}>
          <h1 className={`text-xl font-semibold ${type === 'error' ? 'text-destructive' : 'text-green-600'} mb-2`}>
            {type === 'error' ? 'Error' : 'Success'}
          </h1>
          <p className="mb-4">{message}</p>
          <Link 
            href="/sign-in"
            className="inline-block px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Show error if no code is present
  if (!code) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-destructive bg-card p-6 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-destructive mb-2">Invalid Reset Link</h1>
          <p className="mb-4">This password reset link is invalid or has expired.</p>
          <Link 
            href="/forgot-password"
            className="inline-block px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  // Render the password reset form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <form
          action={async (formData: FormData) => {
            try {
              // Add the code to the form data
              formData.append('code', code);
              return resetPasswordAction(formData);
            } catch (error) {
              console.error("Form action error:", error);
              setError("An unexpected error occurred. Please try again.");
              throw error;
            }
          }}
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
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
                minLength={8}
                className="w-full"
                onInput={() => setError(null)}
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
                minLength={8}
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
  );
}
