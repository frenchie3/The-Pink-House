"use client";

import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface POSCubbyFilterProps {
  cubbyLocations: string[];
  selectedCubby: string | null;
  onSelectCubby: (cubby: string | null) => void;
}

export default function POSCubbyFilter({
  cubbyLocations,
  selectedCubby,
  onSelectCubby,
}: POSCubbyFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <span className="mr-1">{selectedCubby || "All Cubbies"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem
          className="flex items-center justify-between"
          onClick={() => onSelectCubby(null)}
        >
          <span>All Cubbies</span>
          {!selectedCubby && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        {cubbyLocations.map((cubby) => (
          <DropdownMenuItem
            key={cubby}
            className="flex items-center justify-between"
            onClick={() => onSelectCubby(cubby)}
          >
            <span>{cubby}</span>
            {selectedCubby === cubby && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
