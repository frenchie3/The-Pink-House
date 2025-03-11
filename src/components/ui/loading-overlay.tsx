import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";
import { LoadingDots } from "./loading-dots";

interface LoadingOverlayProps {
  isLoading: boolean;
  type?: "spinner" | "dots" | "pulse";
  message?: string;
  blur?: boolean;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  isLoading,
  type = "spinner",
  message,
  blur = true,
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center z-50 bg-white/80 dark:bg-gray-900/80",
        blur ? "backdrop-blur-sm" : "",
        fullScreen ? "fixed inset-0" : "absolute inset-0 rounded-lg",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center p-4 space-y-3 text-center">
        {type === "spinner" && <LoadingSpinner size="lg" />}
        {type === "dots" && <LoadingDots size="lg" />}
        {type === "pulse" && (
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-pink-600 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-pink-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-3 h-3 bg-pink-600 rounded-full animate-pulse delay-150"></div>
          </div>
        )}

        {message && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
