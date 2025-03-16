"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Cubby {
  id: string;
  cubby_number: string;
  location: string;
  status: string;
  [key: string]: any;
}

interface CubbyExtensionOptionsProps {
  currentCubby: any;
  canExtendCurrentCubby: boolean;
  alternativeCubbies: Cubby[];
  loading: boolean;
  error: string | null;
  onSelectCubby: (cubbyId: string) => void;
  selectedCubbyId: string | null;
}

export default function CubbyExtensionOptions({
  currentCubby,
  canExtendCurrentCubby,
  alternativeCubbies,
  loading,
  error,
  onSelectCubby,
  selectedCubbyId,
}: CubbyExtensionOptionsProps) {
  // If we can extend the current cubby, select it by default
  useEffect(() => {
    // Only run this effect if we have loaded the data and confirmed availability
    if (loading || error) return;

    console.log("CubbyExtensionOptions effect running with:", {
      canExtendCurrentCubby,
      "currentCubby?.cubby_id": currentCubby?.cubby_id,
      "currentCubby?.id": currentCubby?.id,
      selectedCubbyId,
      loading,
      error,
    });

    // Determine which ID to use for the current cubby
    let cubbyIdToUse = null;

    // First try to use cubby_id directly from the currentCubby object
    if (currentCubby?.cubby_id) {
      console.log("Using cubby_id from currentCubby:", currentCubby.cubby_id);
      cubbyIdToUse = currentCubby.cubby_id;
    }
    // If that's not available, try the id property
    else if (currentCubby?.id) {
      console.log("Using id from currentCubby as fallback:", currentCubby.id);
      cubbyIdToUse = currentCubby.id;
    }
    // If neither is available but we have a cubby object nested inside currentCubby
    else if (currentCubby?.cubby?.id) {
      console.log("Using id from nested cubby object:", currentCubby.cubby.id);
      cubbyIdToUse = currentCubby.cubby.id;
    }

    // Only update the selected cubby if we found a valid ID and we can extend it
    if (canExtendCurrentCubby && cubbyIdToUse && !selectedCubbyId) {
      console.log("Setting selected cubby ID to:", cubbyIdToUse);
      onSelectCubby(cubbyIdToUse);
    }
  }, [
    canExtendCurrentCubby,
    currentCubby,
    onSelectCubby,
    selectedCubbyId,
    loading,
    error,
  ]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          <p className="text-gray-600">Checking cubby availability...</p>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cubby Options for Extension</CardTitle>
      </CardHeader>
      <CardContent>
        {canExtendCurrentCubby ? (
          <div className="bg-green-50 p-4 rounded-md mb-6 flex items-start gap-3 text-green-800">
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Good news!</p>
              <p className="text-sm mt-1">
                Your current cubby is available for the extension period.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-md mb-6 flex items-start gap-3 text-amber-800">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Cubby Reassignment Required</p>
              <p className="text-sm mt-1">
                Your current cubby is not available for the extension period.
                Please select an alternative cubby from the options below.
              </p>
            </div>
          </div>
        )}

        <RadioGroup
          value={selectedCubbyId || ""}
          onValueChange={onSelectCubby}
          className="space-y-4"
        >
          {/* Current cubby option (if available) */}
          {canExtendCurrentCubby && currentCubby && (
            <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer bg-green-50 border-green-200">
              <RadioGroupItem
                value={
                  currentCubby.cubby_id ||
                  currentCubby.id ||
                  (currentCubby.cubby && currentCubby.cubby.id)
                }
                id={`cubby-${currentCubby.cubby_id || currentCubby.id || (currentCubby.cubby && currentCubby.cubby.id)}`}
              />
              <Label
                htmlFor={`cubby-${currentCubby.cubby_id || currentCubby.id || (currentCubby.cubby && currentCubby.cubby.id)}`}
                className="flex-1 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Keep Current Cubby</p>
                    <p className="text-sm text-gray-700">
                      Cubby #{currentCubby.cubby?.cubby_number} -{" "}
                      {currentCubby.cubby?.location || "Main Floor"}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      No item relocation needed
                    </p>
                  </div>
                  <div className="flex items-center justify-center h-6 w-6 bg-green-100 rounded-full">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </Label>
            </div>
          )}

          {/* Alternative cubbies */}
          {!canExtendCurrentCubby && alternativeCubbies.length > 0 ? (
            alternativeCubbies.map((cubby) => (
              <div
                key={cubby.id}
                className={`flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer ${selectedCubbyId === cubby.id ? "bg-pink-50 border-pink-200" : ""}`}
              >
                <RadioGroupItem value={cubby.id} id={`cubby-${cubby.id}`} />
                <Label
                  htmlFor={`cubby-${cubby.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Cubby #{cubby.cubby_number}</p>
                      <p className="text-sm text-gray-500">
                        {cubby.location || "Main Floor"}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Item relocation required
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            ))
          ) : !canExtendCurrentCubby ? (
            <div className="bg-red-50 p-4 rounded-md text-red-800">
              <p className="font-medium">No alternative cubbies available</p>
              <p className="text-sm mt-1">
                There are no available cubbies for the selected extension
                period. Please try a different extension period or contact staff
                for assistance.
              </p>
            </div>
          ) : null}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
