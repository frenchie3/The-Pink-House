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

export function useCubbyAvailability(startDate: string, endDate: string) {
  const supabase = createClient();
  const [availableCubbies, setAvailableCubbies] = useState<Cubby[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use a single query to fetch both cubbies and rentals
  const {
    data: combinedData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["cubbyAvailability", startDate, endDate],
    queryFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("Please select valid start and end dates");
      }

      // Fetch all cubbies and rentals in parallel
      const [cubbiesResponse, rentalsResponse] = await Promise.all([
        supabase.from("cubbies").select("id, cubby_number, location, status"),
        supabase
          .from("cubby_rentals")
          .select("cubby_id, start_date, end_date")
          .eq("status", "active")
          .or(`start_date.lte.${endDate},end_date.gte.${startDate}`),
      ]);

      if (cubbiesResponse.error) throw cubbiesResponse.error;
      if (rentalsResponse.error) throw rentalsResponse.error;

      return {
        cubbies: cubbiesResponse.data || [],
        rentals: rentalsResponse.data || [],
      };
    },
    enabled: !!startDate && !!endDate,
    staleTime: 30 * 1000, // 30 seconds
  });

  useEffect(() => {
    if (!startDate || !endDate) {
      setError("Please select valid start and end dates");
      setLoading(false);
      return;
    }

    if (isLoading) {
      setLoading(true);
      return;
    }

    if (isError) {
      setError("Failed to fetch available cubbies");
      setLoading(false);
      return;
    }

    if (combinedData) {
      try {
        const { cubbies, rentals } = combinedData;
        const requestedStartDate = new Date(startDate);
        const requestedEndDate = new Date(endDate);

        // Create a set of occupied cubby IDs during the requested period
        const occupiedCubbyIds = new Set();
        rentals.forEach((rental) => {
          const rentalStart = new Date(rental.start_date);
          const rentalEnd = new Date(rental.end_date);

          // Check if the rental period overlaps with the requested period
          if (
            rentalStart < requestedEndDate &&
            rentalEnd > requestedStartDate
          ) {
            occupiedCubbyIds.add(rental.cubby_id);
          }
        });

        // Filter available cubbies - exclude maintenance cubbies and occupied ones
        const available = cubbies.filter(
          (cubby) =>
            cubby.status !== "maintenance" && !occupiedCubbyIds.has(cubby.id),
        );

        setAvailableCubbies(available);
        setError(null);
      } catch (err) {
        console.error("Error processing cubby availability:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process cubby availability",
        );
      } finally {
        setLoading(false);
      }
    }
  }, [combinedData, isLoading, isError, startDate, endDate]);

  return { availableCubbies, loading, error };
}
