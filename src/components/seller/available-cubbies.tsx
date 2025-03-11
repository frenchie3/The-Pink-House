"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useCubbyAvailability } from "@/hooks/use-cubby-availability";

interface AvailableCubbiesProps {
  startDate: string;
  endDate: string;
  onSelectCubby: (cubbyId: string) => void;
}

const AvailableCubbies = memo(function AvailableCubbies({
  startDate,
  endDate,
  onSelectCubby,
}: AvailableCubbiesProps) {
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);

  // Use custom hook for cubby availability
  const { availableCubbies, loading, error } = useCubbyAvailability(
    startDate,
    endDate,
  );

  // Memoize the selection handler to prevent recreation on each render
  const handleCubbySelect = useCallback((cubbyId: string) => {
    setSelectedCubby(cubbyId);
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-pink-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-b-teal-600 rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">
              Checking cubby availability
            </p>
            <p className="text-sm text-gray-500">
              Finding the perfect spot for your items...
            </p>
          </div>
        </div>
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
});

export default AvailableCubbies;
