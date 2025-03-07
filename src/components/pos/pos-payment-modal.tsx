"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { CreditCard, Banknote, Smartphone, X } from "lucide-react";

interface POSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
  onProcessPayment: (paymentMethod: string) => void;
}

export default function POSPaymentModal({
  isOpen,
  onClose,
  cartTotal,
  onProcessPayment,
}: POSPaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Calculate change if cash payment
  const calculateChange = () => {
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - cartTotal);
  };

  // Handle payment submission
  const handleSubmitPayment = () => {
    if (!paymentMethod) return;

    setIsProcessing(true);

    // Simulate payment processing delay
    setTimeout(() => {
      onProcessPayment(paymentMethod);
      setIsProcessing(false);
      setPaymentMethod(null);
      setCashReceived("");
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Total amount due: {formatPrice(cartTotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              className={
                paymentMethod === "cash"
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }
              onClick={() => setPaymentMethod("cash")}
            >
              <Banknote className="mr-2 h-5 w-5" />
              Cash
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              className={
                paymentMethod === "card" ? "bg-blue-600 hover:bg-blue-700" : ""
              }
              onClick={() => setPaymentMethod("card")}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Card
            </Button>
            <Button
              variant={paymentMethod === "digital" ? "default" : "outline"}
              className={
                paymentMethod === "digital"
                  ? "bg-purple-600 hover:bg-purple-700"
                  : ""
              }
              onClick={() => setPaymentMethod("digital")}
            >
              <Smartphone className="mr-2 h-5 w-5" />
              Digital
            </Button>
          </div>

          {paymentMethod === "cash" && (
            <div className="space-y-2">
              <Label htmlFor="cash-received">Cash Received</Label>
              <Input
                id="cash-received"
                type="number"
                min={cartTotal}
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={`Minimum ${formatPrice(cartTotal)}`}
              />

              {parseFloat(cashReceived) >= cartTotal && (
                <div className="bg-green-50 p-3 rounded-md mt-2">
                  <p className="text-sm text-green-800">
                    Change due: {formatPrice(calculateChange())}
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Please process the card payment using the card terminal.
              </p>
            </div>
          )}

          {paymentMethod === "digital" && (
            <div className="bg-purple-50 p-3 rounded-md">
              <p className="text-sm text-purple-800">
                Please ask the customer to complete the payment using their
                mobile device.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPayment}
            disabled={
              !paymentMethod ||
              (paymentMethod === "cash" &&
                parseFloat(cashReceived) < cartTotal) ||
              isProcessing
            }
            className="bg-teal-600 hover:bg-teal-700"
          >
            {isProcessing ? "Processing..." : "Complete Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
