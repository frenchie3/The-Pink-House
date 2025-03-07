"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Banknote, CheckCircle2, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { createClient } from "../../../../../../supabase/client";

export default function CubbyPaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [rentalDetails, setRentalDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams.get("rental_id");
  const supabase = createClient();

  useEffect(() => {
    const fetchRentalDetails = async () => {
      if (!rentalId) {
        setError("No rental ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("cubby_rentals")
          .select("*, cubby:cubbies(cubby_number, location)")
          .eq("id", rentalId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Rental not found");

        setRentalDetails(data);
      } catch (err) {
        console.error("Error fetching rental details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load rental details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRentalDetails();
  }, [rentalId, supabase]);

  const handleProcessPayment = async () => {
    if (!rentalDetails) return;

    setIsProcessing(true);

    try {
      // Fake payment processing - always succeeds without actual payment
      // Simulate a brief delay for user experience
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update payment status in database
      const { error } = await supabase
        .from("cubby_rentals")
        .update({ payment_status: "paid" })
        .eq("id", rentalId);

      if (error) throw error;

      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/seller/cubby");
      }, 1000);
    } catch (err) {
      console.error("Payment processing error:", err);
      setError(
        err instanceof Error ? err.message : "Payment processing failed",
      );
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment details...</p>
            </div>
          </div>
        </main>
      </SellerGuard>
    );
  }

  if (error) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <div className="text-red-500 mb-4 text-lg">Error: {error}</div>
                <Button
                  onClick={() => router.push("/dashboard/seller/cubby/rent")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Rental Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SellerGuard>
    );
  }

  if (success) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6 text-center">
                <div className="bg-green-100 text-green-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
                <p className="text-gray-600 mb-6">
                  Your cubby rental has been confirmed.
                </p>
                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={() => router.push("/dashboard/seller/cubby")}
                >
                  View My Cubby
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </SellerGuard>
    );
  }

  return (
    <SellerGuard>
      <SellerNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Complete Payment
              </h1>
              <p className="text-gray-600 mt-1">
                Finalize your cubby rental by completing payment
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="card" id="card" />
                      <Label htmlFor="card" className="flex-1 cursor-pointer">
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2 text-pink-600" />
                          <div>
                            <p className="font-medium">Credit/Debit Card</p>
                            <p className="text-sm text-gray-500">
                              Pay securely with your card
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 border p-4 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="cash" id="cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer">
                        <div className="flex items-center">
                          <Banknote className="h-5 w-5 mr-2 text-pink-600" />
                          <div>
                            <p className="font-medium">Pay in Store</p>
                            <p className="text-sm text-gray-500">
                              Pay when you visit the shop
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {paymentMethod === "card" && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-medium">Card Details</h3>

                      <div className="space-y-2">
                        <Label htmlFor="card-number">Card Number</Label>
                        <Input
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          className="font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input id="expiry" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc">CVC</Label>
                          <Input id="cvc" placeholder="123" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="name">Name on Card</Label>
                        <Input id="name" placeholder="J. Smith" />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "cash" && (
                    <div className="bg-amber-50 p-4 rounded-md mt-4 border border-amber-200">
                      <p className="text-amber-800">
                        Please note that your cubby will be reserved for 48
                        hours. Payment must be completed in-store within this
                        timeframe to confirm your rental.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {rentalDetails && (
                    <>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Cubby Details
                          </h3>
                          <p className="font-medium">
                            Cubby #{rentalDetails.cubby?.cubby_number}
                          </p>
                          <p className="text-sm text-gray-600">
                            {rentalDetails.cubby?.location || "Main Floor"}
                          </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="text-sm font-medium text-gray-500 mb-2">
                            Rental Period
                          </h3>
                          <p className="font-medium">
                            {new Date(
                              rentalDetails.start_date,
                            ).toLocaleDateString("en-NZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}{" "}
                            to{" "}
                            {new Date(
                              rentalDetails.end_date,
                            ).toLocaleDateString("en-NZ", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Rental Fee:</span>
                            <span className="font-medium">
                              {formatPrice(rentalDetails.rental_fee)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <span className="text-lg font-medium">Total:</span>
                            <span className="text-lg font-bold text-pink-600">
                              {formatPrice(rentalDetails.rental_fee)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full bg-pink-600 hover:bg-pink-700"
                        size="lg"
                        onClick={handleProcessPayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing...
                          </>
                        ) : paymentMethod === "card" ? (
                          "Complete Payment"
                        ) : (
                          "Reserve Cubby"
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </SellerGuard>
  );
}
