"use client";

import { FormMessage } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for the presence of a hash fragment which contains the access token
  useEffect(() => {
    // The hash comes in format like "#access_token=xxx&refresh_token=yyy&..."
    const hash = window.location.hash;
    if (!hash) return;
    
    console.log("Found hash for reset password");
  }, []);

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (!password || !confirmPassword) {
      setError("Password and confirm password are required");
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    try {
      const supabase = createClient();
      
      // The update will use the access token that Supabase automatically 
      // adds to the client when the reset password link is clicked
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        console.error("Error updating password:", error);
        setError(error.message);
        setIsLoading(false);
        return;
      }
      
      // Password updated successfully
      setSuccess("Password updated successfully. You will be redirected to sign in.");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/sign-in?type=success&message=Password has been updated successfully. Please sign in with your new password.");
      }, 2000);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              onSubmit={handlePasswordReset}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Updating password..." : "Update Password"}
              </Button>

              {error && (
                <div className="text-red-500 text-sm p-2 bg-red-50 rounded border border-red-200">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="text-green-500 text-sm p-2 bg-green-50 rounded border border-green-200">
                  {success}
                </div>
              )}

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