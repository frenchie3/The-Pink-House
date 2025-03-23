"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "./ui/loading-dots";

export function SubmitButton({
  children,
  className,
  pendingText = "Processing",
  formAction,
  disabled,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  formAction?: (formData: FormData) => Promise<any>;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} className={className} formAction={formAction}>
      {pending ? (
        <div className="flex items-center">
          <span className="relative flex h-3 w-3 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          {pendingText}
          <LoadingDots color="default" size="sm" className="ml-2" />
        </div>
      ) : (
        children
      )}
    </Button>
  );
}
