"use client";

import { useEffect } from "react";

export function ButtonClickEffect() {
  useEffect(() => {
    // Create a ripple effect on button clicks
    const addRippleEffect = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button, a[role="button"]') as HTMLElement;

      if (!button) return;

      // Create ripple element
      const ripple = document.createElement("span");
      const rect = button.getBoundingClientRect();

      // Calculate position
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Style the ripple
      ripple.style.position = "absolute";
      ripple.style.width = "0";
      ripple.style.height = "0";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.pointerEvents = "none";

      // Add ripple to button
      const buttonElement = button as HTMLElement;
      buttonElement.style.position = "relative";
      buttonElement.style.overflow = "hidden";
      buttonElement.appendChild(ripple);

      // Animate the ripple
      requestAnimationFrame(() => {
        ripple.style.width = `${Math.max(rect.width, rect.height) * 2}px`;
        ripple.style.height = `${Math.max(rect.width, rect.height) * 2}px`;
        ripple.style.opacity = "0";
        ripple.style.transition = "all 0.6s ease-out";

        // Remove ripple after animation
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    };

    // Add event listener
    document.addEventListener("click", addRippleEffect);

    // Cleanup
    return () => {
      document.removeEventListener("click", addRippleEffect);
    };
  }, []);

  return null;
}
