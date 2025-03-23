import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price?: number | null): string {
  // Default to 0 if price is undefined or null
  const safePrice = price ?? 0;
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(safePrice);
}

// Helper function to get property from potentially array fields
export function getProperty<T>(obj: T | T[] | null | undefined, property: keyof T): any {
  if (!obj) return null;
  
  if (Array.isArray(obj)) {
    return obj[0]?.[property] ?? null;
  }
  
  return obj[property] ?? null;
}
