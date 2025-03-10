"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface AvailableCubbiesProps {
  startDate: string;
  endDate: string;
  onSelectCubby: (cubbyId: string) => void;
}

export default function AvailableCubbies({
  startDate,
  endDate,
  onSelectCubby,
}: AvailableCubbiesProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableCubbies, setAvailableCubbies] = useState<any[]>([]);
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAvailableCubbies() {
      if (!startDate || !endDate) {
        setError("Please select valid start and end dates");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch all cubbies
        const { data: cubbiesData, error: cubbiesError } = await supabase
          .from("cubbies")
          .select("*");

        if (cubbiesError) throw cubbiesError;

        // Fetch active rentals that might overlap with the requested period
        const requestedStartDate = new Date(startDate);
        const requestedEndDate = new Date(endDate);

        const { data: rentalsData, error: rentalsError } = await supabase
          .from("cubby_rentals")
          .select("*")
          .eq("status", "active")
          .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

        if (rentalsError) throw rentalsError;

        // Create a set of occupied cubby IDs during the requested period
        const occupiedCubbyIds = new Set();
        rentalsData?.forEach((rental) => {
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
        const available = cubbiesData?.filter(
          (cubby) =>
            cubby.status !== "maintenance" && !occupiedCubbyIds.has(cubby.id),
        );

        setAvailableCubbies(available || []);
      } catch (err) {
        console.error("Error fetching available cubbies:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch available cubbies",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAvailableCubbies();
  }, [startDate, endDate, supabase]);

  const handleCubbySelect = (cubbyId: string) => {
    setSelectedCubby(cubbyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600 mr-2" />
        <p>Checking cubby availability...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md flex items-start gap-3 text-red-800">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (availableCubbies.length === 0) {
    return (
      <div className="bg-amber-50 p-4 rounded-md flex items-start gap-3 text-amber-800">
        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">No cubbies available for selected dates</p>
          <p className="text-sm mt-1">
            Please try different dates or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Available Cubbies</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableCubbies.map((cubby) => (
          <div
            key={cubby.id}
            className={`border p-4 rounded-lg cursor-pointer transition-colors ${selectedCubby === cubby.id ? "bg-pink-50 border-pink-300" : "hover:bg-gray-50"}`}
            onClick={() => handleCubbySelect(cubby.id)}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Cubby #{cubby.cubby_number}</p>
                <p className="text-sm text-gray-500">
                  {cubby.location || "Main Floor"}
                </p>
              </div>
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${selectedCubby === cubby.id ? "border-pink-500 bg-pink-100" : "border-gray-300"}`}
              >
                {selectedCubby === cubby.id && (
                  <CheckCircle className="h-4 w-4 text-pink-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={() => selectedCubby && onSelectCubby(selectedCubby)}
          disabled={!selectedCubby}
          className="bg-pink-600 hover:bg-pink-700"
        >
          Select Cubby
        </Button>
      </div>
    </div>
  );
}
