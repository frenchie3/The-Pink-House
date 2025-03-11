"use client";

import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import POSCategoryFilter from "./pos-category-filter";
import POSCubbyFilter from "./pos-cubby-filter";

interface POSFilterBarProps {
  categories: Array<{ id: string; name: string; description?: string }>;
  cubbyLocations: string[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  selectedCubby: string | null;
  setSelectedCubby: (cubby: string | null) => void;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export function POSFilterBar({
  categories,
  cubbyLocations,
  selectedCategory,
  setSelectedCategory,
  selectedCubby,
  setSelectedCubby,
  hasActiveFilters,
  resetFilters,
}: POSFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <div className="flex items-center">
        <Filter className="h-4 w-4 mr-2 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters:</span>
      </div>

      {/* Category Filter */}
      <POSCategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Cubby Filter */}
      <POSCubbyFilter
        cubbyLocations={cubbyLocations}
        selectedCubby={selectedCubby}
        onSelectCubby={setSelectedCubby}
      />

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={resetFilters}
          className="ml-auto"
        >
          Clear Filters
        </Button>
      )}
    </div>
  );
}
