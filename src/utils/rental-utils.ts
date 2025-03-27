import { createClient } from "../../supabase/client";

/**
 * Calculates the end date of a rental period, only counting the days that the shop is open.
 * 
 * @param startDate - The start date of the rental
 * @param days - The number of open days to count
 * @param openDaysConfig - Optional configuration of open days, if not provided, it will be fetched from the database
 * @returns The calculated end date
 */
export async function calculateRentalEndDate(
  startDate: Date,
  days: number,
  openDaysConfig?: { [key: string]: boolean }
): Promise<Date> {
  // If open days configuration is not provided, fetch it from the database
  if (!openDaysConfig) {
    openDaysConfig = await fetchOpenDaysConfiguration();
  }

  // Default to all days open if no configuration is found
  if (!openDaysConfig || Object.keys(openDaysConfig).length === 0) {
    openDaysConfig = {
      monday: true,
      tuesday: true,
      wednesday: true, 
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };
  }

  // Clone the start date to avoid modifying the original
  const currentDate = new Date(startDate);
  let activeDays = 0;
  let endDate = new Date(startDate);

  // Count days until we reach the requested number of open days
  while (activeDays < days) {
    // Get day of week as lowercase string (e.g., "monday", "tuesday")
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if this day is an open day
    const isOpen = openDaysConfig[dayName] === true;
    
    // If it's an open day, count it as an active day
    if (isOpen) {
      activeDays++;
      endDate = new Date(currentDate); // Update the end date
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return endDate;
}

/**
 * Fetches the shop's open days configuration from the database
 * 
 * @returns Object with days of the week and boolean values indicating if the shop is open
 */
export async function fetchOpenDaysConfiguration(): Promise<{ [key: string]: boolean }> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "shop_open_days")
      .single();
    
    if (error) {
      console.error("Error fetching open days configuration:", error);
      return {};
    }
    
    return data?.setting_value || {};
  } catch (error) {
    console.error("Error fetching open days configuration:", error);
    return {};
  }
}

/**
 * Counts the number of open days between two dates
 * 
 * @param startDate - The start date
 * @param endDate - The end date
 * @param openDaysConfig - Optional configuration of open days
 * @returns The number of open days between the two dates
 */
export async function countOpenDaysBetweenDates(
  startDate: Date,
  endDate: Date,
  openDaysConfig?: { [key: string]: boolean }
): Promise<number> {
  // If open days configuration is not provided, fetch it from the database
  if (!openDaysConfig) {
    openDaysConfig = await fetchOpenDaysConfiguration();
  }

  // Default to all days open if no configuration is found
  if (!openDaysConfig || Object.keys(openDaysConfig).length === 0) {
    openDaysConfig = {
      monday: true,
      tuesday: true,
      wednesday: true, 
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    };
  }

  // Clone the start date to avoid modifying the original
  const currentDate = new Date(startDate);
  let openDaysCount = 0;

  // Count days until we reach the end date
  while (currentDate <= endDate) {
    // Get day of week as lowercase string (e.g., "monday", "tuesday")
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if this day is an open day
    const isOpen = openDaysConfig[dayName] === true;
    
    // If it's an open day, increment the count
    if (isOpen) {
      openDaysCount++;
    }
    
    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return openDaysCount;
}

/**
 * Converts a rental period from days to calendar days based on open days
 * Example: "7 days" might become "9 calendar days" if some days are not open
 * 
 * @param days - The number of rental days
 * @param startDate - The start date of the rental (defaults to current date)
 * @returns Promise with the number of calendar days and the calculated end date
 */
export async function rentalDaysToCalendarDays(
  days: number,
  startDate: Date = new Date()
): Promise<{ calendarDays: number; endDate: Date }> {
  const endDate = await calculateRentalEndDate(startDate, days);
  const calendarDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return { calendarDays, endDate };
} 