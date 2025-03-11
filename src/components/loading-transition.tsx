"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingBar } from "./ui/loading-bar";

// Create a global state for loading that persists across page navigations
let isNavigating = false;
let loadingBarInstance: HTMLDivElement | null = null;

export function LoadingTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Handle navigation state changes
  useEffect(() => {
    // When pathname or searchParams change, we've completed navigation
    if (isNavigating) {
      // Quickly complete the progress bar
      setProgress(100);

      // Reset the navigation state after a short delay
      setTimeout(() => {
        isNavigating = false;
        setIsLoading(false);
      }, 300);
    }
  }, [pathname, searchParams]);

  // Set up click handler for links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (
        link &&
        link.href &&
        !link.href.startsWith("javascript:") &&
        !link.target &&
        !link.hasAttribute("download") &&
        link.hostname === window.location.hostname
      ) {
        // Start loading state immediately
        isNavigating = true;
        setIsLoading(true);
        setProgress(0);

        // Start progress animation
        let currentProgress = 0;
        const interval = setInterval(() => {
          // Increase progress with diminishing returns as it approaches 90%
          const increment = Math.max(1, (90 - currentProgress) / 10);
          currentProgress = Math.min(currentProgress + increment, 90);
          setProgress(currentProgress);

          if (currentProgress >= 90) clearInterval(interval);
        }, 100);

        // Clear interval if navigation takes too long (10 seconds timeout)
        setTimeout(() => {
          clearInterval(interval);
          if (isNavigating) {
            setProgress(95); // Hold at 95% if still navigating
          }
        }, 10000);

        // Add a safety timeout to force complete if navigation never finishes
        setTimeout(() => {
          if (isNavigating) {
            isNavigating = false;
            setProgress(100);
            setTimeout(() => setIsLoading(false), 500);
          }
        }, 15000);
      }
    };

    // Add event listener
    document.addEventListener("click", handleLinkClick);

    // Cleanup
    return () => {
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  // Render only the loading bar for navigation
  return isLoading || isNavigating ? (
    <div
      className="fixed top-0 left-0 right-0 z-[9999]"
      ref={(el) => {
        loadingBarInstance = el;
      }}
    >
      <LoadingBar
        progress={progress}
        height="xs"
        color="primary"
        className="shadow-sm"
      />
    </div>
  ) : null;
}
