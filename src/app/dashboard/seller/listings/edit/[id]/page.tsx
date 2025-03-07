"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import SellerGuard from "@/components/seller-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../../../../supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function EditListingPage() {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    const fetchItemAndCategories = async () => {
      try {
        // Fetch the item details
        const { data: itemData, error: itemError } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (itemError) throw itemError;
        if (!itemData) throw new Error("Item not found");

        setItem(itemData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load item details",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchItemAndCategories();
  }, [supabase, itemId]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setItem((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "quantity" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          name: item.name,
          price: parseFloat(item.price),
          category: item.category,
          description: item.description,
          quantity: parseInt(item.quantity),
          condition: item.condition,
          listing_type: item.listing_type,
          last_updated: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/seller/listings");
      }, 2000);
    } catch (err) {
      console.error("Error updating item:", err);
      setError(err instanceof Error ? err.message : "Failed to update item");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SellerGuard>
        <SellerNavbar />
        <main className="w-full bg-gray-50 h-screen overflow-auto">
          <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-pink-600" />
              <p className="text-gray-600">Loading item details...</p>
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
                  onClick={() => router.push("/dashboard/seller/listings")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Listings
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">Item Updated!</h2>
                <p className="text-gray-600 mb-6">
                  Your item has been successfully updated.
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting to listings...
                </p>
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Item</h1>
              <p className="text-gray-600 mt-1">Update your item details</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/seller/listings")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Listings
            </Button>
          </header>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={item?.name || ""}
                      onChange={handleInputChange}
                      placeholder="Vintage Teacup Set"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (£) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={item?.price || ""}
                      onChange={handleInputChange}
                      placeholder="15.99"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      name="category"
                      value={item?.category || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
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
                      min="0"
                      value={item?.quantity || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      name="condition"
                      value={item?.condition || "Good"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="listing_type">Listing Type</Label>
                    <select
                      id="listing_type"
                      name="listing_type"
                      value={item?.listing_type || "self"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                      <option value="self">
                        Self-Listing (15% commission)
                      </option>
                      <option value="staff">
                        Staff-Managed (25% commission)
                      </option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Self-listing: You manage the item details and photos.
                      <br />
                      Staff-managed: Our staff will handle the listing process
                      for you.
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={item?.description || ""}
                      onChange={handleInputChange}
                      placeholder="Describe your item..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/seller/listings")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Update Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </SellerGuard>
  );
}
