import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createClient } from "../../supabase/client";

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
export function getProperty<T>(
  obj: T | T[] | null | undefined,
  property: keyof T,
): any {
  if (!obj) return null;

  if (Array.isArray(obj)) {
    return obj[0]?.[property] ?? null;
  }

  return obj[property] ?? null;
}

// Open Days Rental Feature utility functions
type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ShopOpenDays = {
  [key in DayOfWeek]: boolean;
};

// Default open days configuration (fallback)
export const DEFAULT_OPEN_DAYS: ShopOpenDays = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: true,
  sunday: false,
};

// Calculate the end date based on open days
export async function calculateOpenDaysEndDate(
  startDate: Date,
  openDaysCount: number,
): Promise<Date> {
  const supabase = createClient();

  try {
    // Format the start date for the SQL function
    const formattedStartDate = startDate.toISOString();

    // Call the SQL function to calculate the end date
    const { data, error } = await supabase.rpc("calculate_open_days_end_date", {
      p_start_date: formattedStartDate,
      p_open_days: openDaysCount,
    });

    if (error) {
      console.error("Error calculating open days end date:", error);
      // Fallback to simple calculation if the function fails
      return new Date(
        startDate.getTime() + openDaysCount * 24 * 60 * 60 * 1000,
      );
    }

    return new Date(data);
  } catch (err) {
    console.error("Exception calculating open days end date:", err);
    // Fallback to simple calculation if the function fails
    return new Date(startDate.getTime() + openDaysCount * 24 * 60 * 60 * 1000);
  }
}

// Count the number of open days between two dates
export async function countOpenDaysBetween(
  startDate: Date,
  endDate: Date,
): Promise<number> {
  const supabase = createClient();

  try {
    // Format the dates for the SQL function
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();

    // Call the SQL function to count open days
    const { data, error } = await supabase.rpc("count_open_days_between", {
      p_start_date: formattedStartDate,
      p_end_date: formattedEndDate,
    });

    if (error) {
      console.error("Error counting open days between dates:", error);
      // Fallback to simple calculation if the function fails
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      );
      return daysDiff;
    }

    return data;
  } catch (err) {
    console.error("Exception counting open days between dates:", err);
    // Fallback to simple calculation if the function fails
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    return daysDiff;
  }
}

// Get the shop's open days configuration
export async function getShopOpenDays(): Promise<ShopOpenDays> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "shop_open_days")
      .single();

    if (error || !data) {
      console.error("Error fetching shop open days:", error);
      return DEFAULT_OPEN_DAYS;
    }

    return data.setting_value as ShopOpenDays;
  } catch (err) {
    console.error("Exception fetching shop open days:", err);
    return DEFAULT_OPEN_DAYS;
  }
}

// Format a date range to show both calendar days and open days
export function formatDateRangeWithOpenDays(
  startDate: Date,
  endDate: Date,
  openDaysCount: number,
): string {
  const startFormatted = startDate.toLocaleDateString();
  const endFormatted = endDate.toLocaleDateString();
  const calendarDays =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;

  return `${startFormatted} to ${endFormatted} (${calendarDays} calendar days, ${openDaysCount} open days)`;
}
