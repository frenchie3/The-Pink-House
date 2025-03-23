import { Suspense } from "react";
import SignInForm from "@/components/auth/sign-in-form";
import Navbar from "@/components/navbar";
import type { Message } from "@/components/form-message";

interface SignInPageProps {
  searchParams: { type?: string; message?: string };
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  // Convert searchParams to Message type
  const message: Message = searchParams.type && searchParams.message
    ? { type: searchParams.type as Message["type"], message: searchParams.message }
    : { type: "success", message: "" };

  return (
    <div className="h-screen flex flex-col">
      <Navbar showDashboard={false} />
      <main className="flex-1 flex items-center justify-center bg-background px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm message={message} />
        </Suspense>
      </main>
    </div>
  );
}
