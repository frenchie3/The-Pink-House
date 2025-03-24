"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PasswordResetSuccess() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="bg-pink-100 p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Password reset successful!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
          </div>
          
          <Button 
            asChild 
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Link href="/sign-in">
              Go to login
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 