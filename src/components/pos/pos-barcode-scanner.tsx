"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrCode, Camera, X } from "lucide-react";

interface POSBarcodeScannerProps {
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function POSBarcodeScanner({
  onClose,
  onScan,
}: POSBarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Simulate camera access and scanning
  useEffect(() => {
    if (isScanning) {
      // In a real implementation, this would access the camera and scan
      // For demo purposes, we'll just simulate a scan after a delay
      const timer = setTimeout(() => {
        setIsScanning(false);
        // Generate a random barcode for demo purposes
        const demoBarcode = `DEMO${Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0")}`;
        onScan(demoBarcode);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isScanning, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onScan(manualBarcode.trim());
    } else {
      setScanError("Please enter a valid barcode");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
          <DialogDescription>
            Scan an item barcode or enter it manually
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {isScanning ? (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
              <p className="mt-4 text-gray-600">Camera is active...</p>
              <p className="text-sm text-gray-500 mt-1">
                Scanning for barcodes
              </p>
              <Button
                variant="outline"
                onClick={() => setIsScanning(false)}
                className="mt-4"
              >
                Cancel Scan
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setScanError(null);
                setIsScanning(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Camera className="mr-2 h-5 w-5" />
              Activate Camera
            </Button>
          )}

          <div className="relative mt-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or enter manually
              </span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <QrCode
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  placeholder="Enter barcode manually"
                  className="pl-10"
                  value={manualBarcode}
                  onChange={(e) => {
                    setManualBarcode(e.target.value);
                    setScanError(null);
                  }}
                />
              </div>
              <Button type="submit">Submit</Button>
            </div>
            {scanError && <p className="text-sm text-red-500">{scanError}</p>}
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
