"use client";

import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  QrCode,
  ShoppingBag,
  Package,
  ArrowUpDown,
} from "lucide-react";
import { useState, useCallback, memo } from "react";

const QuickActionButtons = memo(function QuickActionButtons() {
  const [isScanning, setIsScanning] = useState(false);

  // Memoize the scan click handler to prevent recreation on each render
  const handleScanClick = useCallback(() => {
    setIsScanning(true);
    // In a real implementation, this would activate the camera
    // For demo purposes, we'll just toggle it back after a delay
    setTimeout(() => setIsScanning(false), 3000);
  }, []);

  return (
    <div className="space-y-3">
      <Button
        className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white"
        size="lg"
      >
        <PlusCircle className="mr-2 h-5 w-5" />
        Add New Item
      </Button>

      <Button
        className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
        onClick={handleScanClick}
        disabled={isScanning}
      >
        <QrCode className="mr-2 h-5 w-5" />
        {isScanning ? "Scanning..." : "Scan Barcode"}
      </Button>

      <Button className="w-full justify-start" variant="outline" size="lg">
        <ShoppingBag className="mr-2 h-5 w-5" />
        Process Sale
      </Button>

      <Button className="w-full justify-start" variant="outline" size="lg">
        <ArrowUpDown className="mr-2 h-5 w-5" />
        Update Stock
      </Button>
    </div>
  );
});

export default QuickActionButtons;
