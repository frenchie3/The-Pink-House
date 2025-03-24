"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReloadIcon } from "@radix-ui/react-icons";
import Link from "next/link";

/**
 * Form component for updating the user's password
 * Handles validation and submission to Supabase
 */
export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Enhanced password validation rules with detailed requirements
  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, message: "At least 8 characters" },
      { met: /[A-Z]/.test(password), message: "At least one uppercase letter" },
      { met: /[a-z]/.test(password), message: "At least one lowercase letter" },
      { met: /[0-9]/.test(password), message: "At least one number" },
      { met: /[^A-Za-z0-9]/.test(password), message: "At least one special character" }
    ];
    
    return requirements;
  };
  
  // Calculate password strength for the progress bar
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    const requirements = validatePassword(password);
    const metCount = requirements.filter(req => req.met).length;
    return (metCount / requirements.length) * 100;
  };
  
  // Get CSS color for password strength
  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-red-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    // Validate passwords
    const requirements = validatePassword(password);
    const failedRequirements = requirements.filter(req => !req.met);
    
    if (failedRequirements.length > 0) {
      setError(`Password does not meet requirements: ${failedRequirements.map(r => r.message).join(", ")}`);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      // Show success message and redirect after a delay
      setSuccess("Password updated successfully!");
      setTimeout(() => {
        router.push("/password-reset-success");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while updating your password");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate current password strength
  const passwordStrength = calculatePasswordStrength(password);
  const strengthColor = getStrengthColor(passwordStrength);
  const requirements = validatePassword(password);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
          className="border-gray-300 focus:border-pink-500 focus:ring-pink-500"
        />
        
        {password && (
          <div className="mt-2 space-y-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Password strength</Label>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-300 ${strengthColor}`} 
                  style={{ width: `${passwordStrength}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Requirements:</Label>
              <ul className="text-xs space-y-1.5 mt-1">
                {requirements.map((req, index) => (
                  <li key={index} className={req.met ? "text-green-600" : "text-muted-foreground flex items-center"}>
                    {req.met ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0" />
                      </svg>
                    )}
                    {req.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          disabled={isLoading}
          className="border-gray-300 focus:border-pink-500 focus:ring-pink-500"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-pink-600 hover:bg-pink-700 text-white mt-6" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
            Updating Password
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
} 