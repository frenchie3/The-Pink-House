"use client";

import { useState, useEffect } from "react";
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
 * @param currentCubbyId The ID of the current cubby being rented (not the rental ID)
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
    error: queryError,
  } = useQuery({
    queryKey: ["cubbyExtension", currentCubbyId, currentEndDate, newEndDate],
    queryFn: async () => {
      try {
        console.log("Starting cubby extension check with params:", {
          currentCubbyId,
          currentEndDate,
          newEndDate,
        });

        if (!currentCubbyId || !currentEndDate || !newEndDate) {
          throw new Error("Missing required parameters for extension check");
        }

        // Convert dates to Date objects for comparison
        const currentEndDateObj = new Date(currentEndDate);
        const newEndDateObj = new Date(newEndDate);

        console.log("Date objects created:", {
          currentEndDateObj: currentEndDateObj.toISOString(),
          newEndDateObj: newEndDateObj.toISOString(),
        });

        // Validate dates
        if (newEndDateObj <= currentEndDateObj) {
          throw new Error("New end date must be after current end date");
        }

        // The extension period starts exactly at the current end date
        const extensionStartDate = new Date(currentEndDateObj);

        // Format dates for Supabase queries - use full ISO string for precise comparison
        const formattedExtensionStart = extensionStartDate.toISOString();
        const formattedNewEndDate = newEndDateObj.toISOString();

        console.log("Formatted dates for query:", {
          formattedExtensionStart,
          formattedNewEndDate,
        });

        // We already have the cubby ID, so we don't need to fetch the rental ID separately
        // The currentCubbyId is directly used to check for conflicts
        console.log("Using cubby ID for availability check:", currentCubbyId);

        // We don't need the rental ID for this check since we're checking availability based on the cubby ID
        // We're looking for any conflicting rentals for this cubby during the extension period

        console.log("Checking availability for cubby extension");

        // 2. Check if current cubby is available for extension period
        // We need to find any OTHER rentals for this cubby that overlap with our extension period
        console.log(
          "Checking for conflicting rentals for cubby:",
          currentCubbyId,
        );
        const { data: allCubbyRentals, error: conflictError } = await supabase
          .from("cubby_rentals")
          .select("id, cubby_id, start_date, end_date")
          .eq("cubby_id", currentCubbyId)
          .eq("status", "active");

        if (conflictError) {
          console.error("Error fetching cubby rentals:", conflictError);
          throw new Error(
            `Error checking for conflicts: ${conflictError.message}`,
          );
        }

        console.log("All cubby rentals for this cubby:", allCubbyRentals);

        // Check for any rentals that would conflict with our extension period
        // We need to exclude the current rental from this check to avoid self-conflict
        // First, get the current rental ID from the cubby rentals
        const currentRentalIds = allCubbyRentals
          .filter((rental) => {
            // Find rentals that end exactly at our extension start date
            // These are likely our current rental
            const rentalEnd = new Date(rental.end_date);
            // Only apply this logic if the cubby_id matches the current cubby ID
            return (
              rental.cubby_id === currentCubbyId &&
              Math.abs(rentalEnd.getTime() - extensionStartDate.getTime()) <
                86400000
            ); // Within 24 hours
          })
          .map((rental) => rental.id);

        console.log(
          "Current rental IDs to exclude from conflict check:",
          currentRentalIds,
        );

        // Now filter for conflicting rentals, excluding our current rental
        const conflictingRentals = allCubbyRentals.filter((rental) => {
          // Skip our current rental to avoid self-conflict
          if (currentRentalIds.includes(rental.id)) {
            console.log(
              "Skipping current rental in conflict check:",
              rental.id,
            );
            return false;
          }

          // We only care about future rentals that would overlap with our extension
          const rentalStart = new Date(rental.start_date);
          const rentalEnd = new Date(rental.end_date);

          // A rental conflicts if it starts after our current end date but before our new end date
          // OR if it ends after our current end date but before our new end date
          const hasOverlap =
            (rentalStart >= extensionStartDate &&
              rentalStart <= newEndDateObj) ||
            (rentalEnd >= extensionStartDate && rentalEnd <= newEndDateObj);

          if (hasOverlap) {
            console.log("Found conflicting rental:", rental);
          }

          return hasOverlap;
        });

        console.log("Conflicting rentals count:", conflictingRentals.length);

        // 3. If current cubby has conflicts, find alternative cubbies
        console.log("Fetching all cubbies and active rentals");
        const [cubbiesResponse, rentalsResponse] = await Promise.all([
          supabase.from("cubbies").select("id, cubby_number, location, status"),
          supabase
            .from("cubby_rentals")
            .select("id, cubby_id, start_date, end_date")
            .eq("status", "active")
            // Use explicit filter conditions instead of .or() string
            .filter("start_date", "lte", formattedNewEndDate)
            .filter("end_date", "gte", formattedExtensionStart),
        ]);

        if (cubbiesResponse.error) {
          console.error("Error fetching cubbies:", cubbiesResponse.error);
          throw new Error(
            `Error fetching available cubbies: ${cubbiesResponse.error.message}`,
          );
        }

        if (rentalsResponse.error) {
          console.error("Error fetching rentals:", rentalsResponse.error);
          throw new Error(
            `Error fetching rental data: ${rentalsResponse.error.message}`,
          );
        }

        const cubbies = cubbiesResponse.data || [];
        const rentals = rentalsResponse.data || [];

        console.log("Fetched cubbies count:", cubbies.length);
        console.log("Fetched rentals count:", rentals.length);

        // Create a set of occupied cubby IDs during the extension period
        const occupiedCubbyIds = new Set();

        rentals.forEach((rental) => {
          // Skip if this is for our current cubby - we already checked conflicts for it separately
          if (rental.cubby_id === currentCubbyId) return;

          const rentalStart = new Date(rental.start_date);
          const rentalEnd = new Date(rental.end_date);

          // Check if the rental period overlaps with the extension period
          if (rentalStart <= newEndDateObj && rentalEnd >= extensionStartDate) {
            occupiedCubbyIds.add(rental.cubby_id);
            console.log("Marking cubby as occupied:", rental.cubby_id);
          }
        });

        console.log("Total occupied cubbies:", occupiedCubbyIds.size);

        // Filter available cubbies - exclude maintenance cubbies and occupied ones
        const availableCubbies = cubbies.filter((cubby) => {
          const isAvailable =
            cubby.status !== "maintenance" &&
            !occupiedCubbyIds.has(cubby.id) &&
            cubby.id !== currentCubbyId; // Exclude current cubby as we already checked it

          if (isAvailable) {
            console.log("Available cubby found:", cubby);
          }

          return isAvailable;
        });

        console.log(
          "Total available alternative cubbies:",
          availableCubbies.length,
        );
        console.log(
          "Can extend current cubby:",
          conflictingRentals.length === 0,
        );

        return {
          canExtendCurrentCubby: conflictingRentals.length === 0,
          alternativeCubbies: availableCubbies,
        };
      } catch (err) {
        console.error("Error in cubby extension check:", err);
        throw err; // Re-throw to be caught by React Query's error handling
      }
    },
    enabled: Boolean(currentCubbyId && currentEndDate && newEndDate),
    staleTime: 30 * 1000, // 30 seconds
    retry: 1, // Only retry once to avoid excessive requests on failure
  });

  // Handle error state - use useEffect to avoid setting state during render
  useEffect(() => {
    if (isError) {
      const errorMessage =
        queryError instanceof Error
          ? queryError.message
          : "Failed to check cubby availability for extension";

      console.error("Cubby extension error in hook:", errorMessage);
      setError(errorMessage);
    }
  }, [isError, queryError]);

  return {
    canExtendCurrentCubby: extensionData?.canExtendCurrentCubby || false,
    alternativeCubbies: extensionData?.alternativeCubbies || [],
    loading: isLoading,
    error,
  };
}
