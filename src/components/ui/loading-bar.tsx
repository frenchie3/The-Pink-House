import { cn } from "@/lib/utils";

interface LoadingBarProps {
  progress?: number;
  indeterminate?: boolean;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  height?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function LoadingBar({
  progress = 0,
  indeterminate = false,
  color = "primary",
  height = "md",
  className,
}: LoadingBarProps) {
  const colorClasses = {
    default: "bg-gray-500",
    primary: "bg-pink-600",
    secondary: "bg-teal-600",
    success: "bg-green-600",
    warning: "bg-amber-600",
    danger: "bg-red-600",
  };

  const heightClasses = {
    xs: "h-0.5",
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div
      className={cn(
        "w-full bg-gray-200 rounded-full overflow-hidden",
        heightClasses[height],
        className,
      )}
    >
      <div
        className={cn(
          colorClasses[color],
          heightClasses[height],
          indeterminate ? "animate-progress-indeterminate" : "",
        )}
        style={{
          width: indeterminate
            ? "100%"
            : `${Math.min(Math.max(progress, 0), 100)}%`,
          transition: "width 0.3s ease",
        }}
      ></div>
    </div>
  );
}
