import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  color = "primary",
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colorClasses = {
    default: "text-gray-500",
    primary: "text-pink-600",
    secondary: "text-teal-600",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };

  // Grid spinner (square of dots)
  return (
    <div className={cn("inline-block", className)}>
      <div className={cn("grid grid-cols-3 gap-1", sizeClasses[size])}>
        {[...Array(9)].map((_, i) => (
          <div
            key={i}
            className={cn("rounded-full animate-bounce", colorClasses[color])}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "0.8s",
              width: "100%",
              height: "100%",
              backgroundColor: "currentColor",
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}
