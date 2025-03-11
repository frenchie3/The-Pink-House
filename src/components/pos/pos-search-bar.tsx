"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, QrCode } from "lucide-react";

interface POSSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsScanning: (isScanning: boolean) => void;
}

export function POSSearchBar({
  searchQuery,
  setSearchQuery,
  setIsScanning,
}: POSSearchBarProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4">
      {/* Search Bar */}
      <div className="relative flex-grow">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={18}
        />
        <Input
          type="search"
          placeholder="Search by name, SKU, or barcode..."
          className="pl-10 w-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Barcode Scanner Button */}
      <Button
        onClick={() => setIsScanning(true)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        <QrCode className="mr-2 h-5 w-5" />
        Scan Barcode
      </Button>
    </div>
  );
}
