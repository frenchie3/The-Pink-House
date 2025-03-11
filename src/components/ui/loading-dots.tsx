import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingDots({
  color = "primary",
  size = "md",
  className,
}: LoadingDotsProps) {
  const colorClasses = {
    default: "bg-gray-500",
    primary: "bg-pink-600",
    secondary: "bg-teal-600",
    success: "bg-green-600",
    warning: "bg-amber-600",
    danger: "bg-red-600",
  };

  const sizeClasses = {
    sm: "h-1 w-1 mx-0.5",
    md: "h-2 w-2 mx-1",
    lg: "h-3 w-3 mx-1.5",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "rounded-full animate-bounce",
          colorClasses[color],
          sizeClasses[size],
          "[animation-delay:-0.3s]",
        )}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          colorClasses[color],
          sizeClasses[size],
          "[animation-delay:-0.15s]",
        )}
      />
      <div
        className={cn(
          "rounded-full animate-bounce",
          colorClasses[color],
          sizeClasses[size],
        )}
      />
    </div>
  );
}
