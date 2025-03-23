"use client";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import Navbar from "@/components/navbar";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a valid session when hash parameters are processed
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        setError("Invalid or expired password reset link. Please request a new password reset link.");
        return;
      }
      
      if (data?.session) {
        setIsTokenValid(true);
      } else {
        setError("No active session found. Please request a new password reset link.");
      }
    };
    
    checkSession();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setError(error.message);
      } else {
        setMessage("Password updated successfully!");
        // Redirect to sign-in after a short delay
        setTimeout(() => {
          router.push('/sign-in?type=success&message=Password reset successfully. Please sign in with your new password.');
        }, 2000);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (error && !isTokenValid) {
    return (
      <div className="flex h-screen w-full flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="mb-4">{error}</p>
          <Link
            href="/forgot-password"
            className="text-primary font-medium hover:underline transition-all"
          >
            Request a new password reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <form
            onSubmit={handleSubmit}
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
                  type="password"
                  placeholder="Enter new password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  type="password"
                  placeholder="Confirm new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="w-full"
                />
              </div>
            </div>

            <SubmitButton
              disabled={loading}
              pendingText="Updating password..."
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              Reset Password
            </SubmitButton>

            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            {message && <p className="text-green-600 text-sm text-center">{message}</p>}

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
