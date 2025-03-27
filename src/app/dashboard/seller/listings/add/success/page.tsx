"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, PlusCircle, ArrowLeft } from "lucide-react";

// Inner component that uses useSearchParams
function AddItemSuccessInner() {
  const [itemDetails, setItemDetails] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item_id");
  const itemName = searchParams.get("name");
  const listingType = searchParams.get("type");
  const [isAddingAnother, setIsAddingAnother] = useState(false);

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

  const handleAddAnother = () => {
    setIsAddingAnother(true);
    router.push("/dashboard/seller/listings/add");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Item Added Successfully!
            </h1>
            <p className="mb-6 text-gray-600">
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

            <div className="flex w-full flex-col gap-3">
              <Button
                onClick={handleAddAnother}
                className="w-full"
                disabled={isAddingAnother}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Another Item
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/seller/listings")}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Return to Listings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// Main component wrapped in Suspense
export default function AddItemSuccessPage() {
  return (
    <Suspense fallback={null}>
      <AddItemSuccessInner />
    </Suspense>
  );
}
