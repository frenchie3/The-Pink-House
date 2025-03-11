import { Button } from "./button";
import { LoadingDots } from "./loading-dots";
import { LoadingSpinner } from "./loading-spinner";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonLoadingProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
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
}

export const ButtonLoading = forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  (
    {
      children,
      isLoading = false,
      loadingText,
      loadingType = "spinner",
      variant = "default",
      size = "default",
      className,
      disabled,
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
