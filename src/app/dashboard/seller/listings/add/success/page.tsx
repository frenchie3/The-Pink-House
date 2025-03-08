"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, PlusCircle, ArrowLeft } from "lucide-react";

export default function AddItemSuccessPage() {
  const [itemDetails, setItemDetails] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");
  const itemName = searchParams.get("name");
  const listingType = searchParams.get("type");

  useEffect(() => {
    // In a real app, you might fetch the item details here
    // For now, we'll just use the search params
    if (itemName) {
      setItemDetails({
        name: itemName,
        type: listingType || "self",
      });
    }
  }, [itemName, listingType]);

  return (
    <>
      <SellerNavbar />
      <main className="w-full bg-gray-50 h-screen overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="bg-green-100 text-green-800 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Item Added Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                {itemDetails?.name ? (
                  <>
                    Your item <strong>"{itemDetails.name}"</strong> has been
                    added to your inventory.
                    {itemDetails?.type === "staff" ? (
                      <span className="block mt-2 text-amber-600">
                        Our staff will review and finalize your listing soon.
                      </span>
                    ) : (
                      <span className="block mt-2 text-amber-600">
                        You can continue to edit this item until you bring it to
                        the shop for staff review.
                      </span>
                    )}
                  </>
                ) : (
                  "Your item has been added to your inventory."
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/seller/listings")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  View My Listings
                </Button>

                <Button
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={() => router.push("/dashboard/seller/listings/add")}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Another Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
