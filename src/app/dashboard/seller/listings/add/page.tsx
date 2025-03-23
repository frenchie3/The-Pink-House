"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { createClient } from "../../../../../../supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LayoutWrapper, MainContent } from "@/components/layout-wrapper";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Loader2, Clock, InfoIcon } from "lucide-react";
import { getProperty } from "@/lib/utils";

// Server action wrapper
import { addItemAction } from "./actions";

// Inner component that uses useSearchParams
function AddListingInner({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [itemLimit, setItemLimit] = useState(10);
  const [remainingItems, setRemainingItems] = useState(10);
  const [activeCubby, setActiveCubby] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  // Load essential data first
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch active cubby - this is essential
        const { data: activeCubby } = await supabase
          .from("cubby_rentals")
          .select(
            "id, cubby_id, listing_type, commission_rate, cubby:cubbies(cubby_number)",
          )
          .eq("seller_id", user.id)
          .eq("status", "active")
          .single();
        setActiveCubby(activeCubby);

        // Set initial data as loaded
        setInitialDataLoaded(true);
        setLoading(false);
      } catch (error) {
        console.error("Error loading initial data:", error);
        setLoading(false);
      }
    };

    loadInitialData();
  }, [supabase, router]);

  // Load secondary data after initial render
  useEffect(() => {
    if (!initialDataLoaded || !activeCubby) return;

    const loadSecondaryData = async () => {
      try {
        // Load these in parallel
        const [
          categoriesResponse,
          itemCountResponse,
          itemLimitResponse,
          userDataResponse,
        ] = await Promise.all([
          // Categories for dropdown
          supabase.from("categories").select("id, name").order("name"),

          // Current item count
          supabase
            .from("inventory_items")
            .select("id", { count: "exact", head: true })
            .eq("seller_id", activeCubby.seller_id),

          // Item limit settings
          supabase
            .from("system_settings")
            .select("setting_value")
            .eq("setting_key", "cubby_item_limits")
            .single(),

          // User subscription plan
          supabase
            .from("users")
            .select("subscription")
            .eq("id", activeCubby.seller_id)
            .single(),
        ]);

        // Set categories
        setCategories(categoriesResponse.data || []);

        // Calculate remaining items
        const currentItemCount = itemCountResponse.count || 0;
        const userPlan = userDataResponse.data?.subscription || "default";
        const limit = itemLimitResponse.data?.setting_value?.[userPlan] || 10;

        setItemLimit(limit);
        setRemainingItems(limit - currentItemCount);
      } catch (error) {
        console.error("Error loading secondary data:", error);
      }
    };

    loadSecondaryData();
  }, [initialDataLoaded, activeCubby, supabase]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Basic client-side validation
      const name = formData.get("name") as string;
      const price = formData.get("price") as string;
      const category = formData.get("category") as string;

      if (!name || !price || !category) {
        alert("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      // Immediately redirect to success page for better UX
      const successUrl = `/dashboard/seller/listings/add/success?name=${encodeURIComponent(name)}&type=${activeCubby?.listing_type || "self"}`;

      // Submit the form data to the server action in the background
      addItemAction(formData);

      // Redirect immediately without waiting for the server action to complete
      router.push(successUrl);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SellerGuard>
        <LayoutWrapper>
          <SellerNavbar />
          <MainContent>
            <div className="flex justify-center items-center min-h-[60vh]">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading form...</p>
              </div>
            </div>
          </MainContent>
        </LayoutWrapper>
      </SellerGuard>
    );
  }

  return (
    <SellerGuard>
      <LayoutWrapper>
        <SellerNavbar />
        <MainContent>
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Add New Item
                </h1>
                <p className="text-gray-600 mt-1">
                  Add a new item to your cubby
                </p>
              </div>
            </header>

            {!activeCubby ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    You need an active cubby rental to add items
                  </p>
                  <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                    <a href="/dashboard/seller/cubby">Rent a Cubby</a>
                  </Button>
                </CardContent>
              </Card>
            ) : remainingItems <= 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    You've reached your limit of {itemLimit} items
                  </p>
                  <Button className="bg-pink-600 hover:bg-pink-700" asChild>
                    <a href="/dashboard/seller/listings">View Your Listings</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                  <p className="text-sm text-gray-500">
                    You can add {remainingItems} more item
                    {remainingItems !== 1 ? "s" : ""} to your cubby
                  </p>
                </CardHeader>
                <CardContent>
                  {searchParams.error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
                      {searchParams.error}
                    </div>
                  )}
                  {searchParams.success && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md">
                      {searchParams.success}
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Your active cubby rental:</p>
                        <p className="text-sm mt-1">
                          Cubby #{getProperty(activeCubby.cubby, 'cubby_number')}
                        </p>
                        {activeCubby.remaining_days > 0 ? (
                          <p className="text-xs text-blue-700 mt-1">
                            {activeCubby.remaining_days} days remaining
                          </p>
                        ) : (
                          <p className="text-xs text-red-700 mt-1">
                            Expired! Please renew your cubby rental.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Item Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Vintage Teacup Set"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($) *</Label>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="15.99"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <select
                          id="category"
                          name="category"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories?.map((category) => (
                            <option key={category.id} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <Input
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          defaultValue="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="condition">Condition</Label>
                        <select
                          id="condition"
                          name="condition"
                          className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          <option value="New">New</option>
                          <option value="Like New">Like New</option>
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                        </select>
                      </div>

                      {activeCubby && (
                        <div className="space-y-2">
                          <Label htmlFor="listing_info">Listing Type</Label>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium">
                              {activeCubby.listing_type === "self"
                                ? "Self-Listing"
                                : "Staff-Managed"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Commission Rate:{" "}
                              {(activeCubby.commission_rate * 100).toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {activeCubby.listing_type === "self"
                                ? "You are responsible for managing all item details and photos. You can edit items until they are reviewed by staff."
                                : "Our staff will handle the listing process for you."}
                            </p>
                            <input
                              type="hidden"
                              name="listing_type"
                              value={activeCubby.listing_type}
                            />
                            <input
                              type="hidden"
                              name="cubby_id"
                              value={activeCubby.cubby_id}
                            />
                            <input
                              type="hidden"
                              name="cubby_number"
                              value={activeCubby.cubby?.cubby_number}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Describe your item..."
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline" asChild>
                        <a href="/dashboard/seller/listings">Cancel</a>
                      </Button>
                      <Button
                        type="submit"
                        className="bg-pink-600 hover:bg-pink-700"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Adding Item..." : "Add Item"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </MainContent>
      </LayoutWrapper>
    </SellerGuard>
  );
}

// Main component wrapped in Suspense
export default function AddListingPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <Suspense fallback={null}>
      <AddListingInner searchParams={searchParams} />
    </Suspense>
  );
}
