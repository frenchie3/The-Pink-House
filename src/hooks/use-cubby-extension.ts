"use client";

import { useState } from "react";
import { createClient } from "../../supabase/client";
import { useQuery } from "@tanstack/react-query";

interface Cubby {
  id: string;
  cubby_number: string;
  location: string;
  status: string;
  [key: string]: any;
}

interface ExtensionResult {
  canExtendCurrentCubby: boolean;
  alternativeCubbies: Cubby[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to check if a cubby rental can be extended and find alternatives if not
 * @param currentCubbyId The ID of the current cubby being rented
 * @param currentEndDate The current end date of the rental
 * @param newEndDate The proposed new end date for the extension
 * @returns ExtensionResult with availability status and alternatives
 */
export function useCubbyExtension(
  currentCubbyId: string,
  currentEndDate: string,
  newEndDate: string,
): ExtensionResult {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);

  // Use React Query to fetch data and handle loading/error states
  const {
    data: extensionData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cubbyExtension", currentCubbyId, currentEndDate, newEndDate],
    queryFn: async () => {
      if (!currentCubbyId || !currentEndDate || !newEndDate) {
        throw new Error("Missing required parameters for extension check");
      }

      // Convert dates to Date objects for comparison
      const currentEndDateObj = new Date(currentEndDate);
      const newEndDateObj = new Date(newEndDate);

      // Validate dates
      if (newEndDateObj <= currentEndDateObj) {
        throw new Error("New end date must be after current end date");
      }

      // The extension period starts exactly at the current end date
      // No need to add a day as we want to extend from the current end date
      const extensionStartDate = new Date(currentEndDateObj);

      // Format dates for Supabase queries - use full ISO string for precise comparison
      const formattedExtensionStart = extensionStartDate.toISOString();
      const formattedNewEndDate = newEndDateObj.toISOString();

      // 1. Check if current cubby is available for extension period
      // We need to find any OTHER rentals for this cubby that overlap with our extension period
      // First, get all active rentals for this cubby
      const { data: allCubbyRentals, error: conflictError } = await supabase
        .from("cubby_rentals")
        .select("id, cubby_id, start_date, end_date")
        .eq("cubby_id", currentCubbyId)
        .eq("status", "active");

      if (conflictError) throw conflictError;

      // Get the current rental ID (not just the cubby ID)
      const { data: currentRentalData } = await supabase
        .from("cubby_rentals")
        .select("id")
        .eq("cubby_id", currentCubbyId)
        .eq("status", "active")
        .single();

      const currentRentalId = currentRentalData?.id;

      if (!currentRentalId) {
        throw new Error("Could not find active rental for the current cubby");
      }

      // Then manually filter out the current rental and check for overlaps
      // This avoids potential issues with the .neq() filter in Supabase
      const conflictingRentals = allCubbyRentals.filter((rental) => {
        // Skip the current rental we're trying to extend
        if (rental.id === currentRentalId) return false;

        // Check for overlap: other rental starts before our new end AND ends after our extension start
        const rentalStart = new Date(rental.start_date);
        const rentalEnd = new Date(rental.end_date);
        return rentalStart <= newEndDateObj && rentalEnd >= extensionStartDate;
      });

      if (conflictError) throw conflictError;

      // 2. If current cubby has conflicts, find alternative cubbies
      // Fetch all cubbies and active rentals in parallel
      const [cubbiesResponse, rentalsResponse] = await Promise.all([
        supabase.from("cubbies").select("id, cubby_number, location, status"),
        supabase
          .from("cubby_rentals")
          .select("cubby_id, start_date, end_date")
          .eq("status", "active")
          .or(
            `start_date.lte.${formattedNewEndDate},end_date.gte.${formattedExtensionStart}`,
          ),
      ]);

      if (cubbiesResponse.error) throw cubbiesResponse.error;
      if (rentalsResponse.error) throw rentalsResponse.error;

      const cubbies = cubbiesResponse.data || [];
      const rentals = rentalsResponse.data || [];

      // Create a set of occupied cubby IDs during the extension period
      const occupiedCubbyIds = new Set();

      // We already have currentRentalId from above, so we can use it directly

      rentals.forEach((rental) => {
        // We need to check if this rental's cubby_id matches our current cubby_id AND
        // if the rental ID matches our current rental ID - if so, skip it
        if (rental.cubby_id === currentCubbyId && rental.id === currentRentalId)
          return;

        const rentalStart = new Date(rental.start_date);
        const rentalEnd = new Date(rental.end_date);

        // Check if the rental period overlaps with the extension period
        if (rentalStart <= newEndDateObj && rentalEnd >= extensionStartDate) {
          occupiedCubbyIds.add(rental.cubby_id);
        }
      });

      // Filter available cubbies - exclude maintenance cubbies and occupied ones
      const availableCubbies = cubbies.filter(
        (cubby) =>
          cubby.status !== "maintenance" &&
          !occupiedCubbyIds.has(cubby.id) &&
          cubby.id !== currentCubbyId, // Exclude current cubby as we already checked it
      );

      return {
        canExtendCurrentCubby: conflictingRentals.length === 0,
        alternativeCubbies: availableCubbies,
      };
    },
    enabled: !!currentCubbyId && !!currentEndDate && !!newEndDate,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Handle error state
  if (isError) {
    setError("Failed to check cubby availability for extension");
  }

  return {
    canExtendCurrentCubby: extensionData?.canExtendCurrentCubby || false,
    alternativeCubbies: extensionData?.alternativeCubbies || [],
    loading: isLoading,
    error,
  };
}
