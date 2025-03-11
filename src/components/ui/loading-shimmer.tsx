import { cn } from "@/lib/utils";

interface LoadingShimmerProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: "none" | "sm" | "md" | "lg" | "full";
}

export function LoadingShimmer({
  className,
  width = "100%",
  height = "20px",
  rounded = "md",
}: LoadingShimmerProps) {
  const roundedClasses = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:400%_100%] animate-shimmer",
        roundedClasses[rounded],
        className,
      )}
      style={{ width, height }}
    ></div>
  );
}
