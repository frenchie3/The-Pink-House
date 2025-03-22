import { Button } from "./button";
import { LoadingDots } from "./loading-dots";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonLoadingProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  pendingText?: string;
  loadingType?: "spinner" | "dots";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  formAction?: (formData: FormData) => Promise<any>;
}

export const ButtonLoading = forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  (
    {
      children,
      isLoading = false,
      pendingText,
      loadingType = "spinner",
      variant = "default",
      size = "default",
      className,
      disabled,
      formAction,
      ...props
    },
    ref,
  ) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || isLoading}
        className={cn(isLoading && "relative cursor-not-allowed", className)}
        formAction={formAction}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            {loadingType === "spinner" ? (
              <LoadingSpinner size="sm" color="default" />
            ) : (
              <LoadingDots size="sm" color="default" />
            )}
          </span>
        )}
        <span className={cn(isLoading && "invisible")}>{children}</span>
      </Button>
    );
  },
);

ButtonLoading.displayName = "ButtonLoading";
