import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Error page displayed when a password reset link is invalid or expired
 * Provides clear instructions to the user on how to proceed
 */
export default function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  // Determine specific error message based on reason
  let errorTitle = "Authentication Error";
  let errorDescription = "Your authentication link is invalid or has expired";
  let errorContent = (
    <>
      <p>
        The password reset link you clicked is either invalid or has expired. 
        Password reset links are valid for a limited time for security reasons.
      </p>
      <p>
        Please request a new password reset link to continue.
      </p>
    </>
  );

  // Provide more specific feedback based on error reason
  if (searchParams.reason === "invalid_redirect") {
    errorTitle = "Invalid Redirect";
    errorDescription = "The redirect URL in your link is not allowed";
    errorContent = (
      <>
        <p>
          The link you clicked contains an invalid redirect URL. This could be due to:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>A tampered or malformed password reset link</li>
          <li>A security protection preventing redirects to untrusted sites</li>
        </ul>
        <p className="mt-2">
          Please request a new password reset link from our official website.
        </p>
      </>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{errorTitle}</CardTitle>
          <CardDescription>
            {errorDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorContent}
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