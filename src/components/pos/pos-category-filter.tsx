"use client";

import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface POSCategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export default function POSCategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: POSCategoryFilterProps) {
  // Find the selected category name
  const selectedCategoryName = selectedCategory
    ? categories.find((cat) => cat.id === selectedCategory)?.name || "Unknown"
    : "All Categories";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <span className="mr-1">{selectedCategoryName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => onSelectCategory(null)}
        >
          <span>All Categories</span>
          {!selectedCategory && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            className="flex items-center justify-between"
            onClick={() => onSelectCategory(category.id)}
          >
            <span>{category.name}</span>
            {selectedCategory === category.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
