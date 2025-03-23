import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Error page displayed when a password reset link is invalid or expired
 * Provides clear instructions to the user on how to proceed
 */
export default function AuthCodeErrorPage() {
  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            Your authentication link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The password reset link you clicked is either invalid or has expired. 
            Password reset links are valid for a limited time for security reasons.
          </p>
          <p>
            Please request a new password reset link to continue.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/sign-in">
              Back to Sign In
            </Link>
          </Button>
          <Button asChild>
            <Link href="/forgot-password">
              Request New Link
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 