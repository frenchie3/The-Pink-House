"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import SellerNavbar from "@/components/seller-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../../../../supabase/client";
import { ArrowLeft, Loader2, Clock, LockIcon } from "lucide-react";
import { LayoutWrapper, MainContent } from "@/components/layout-wrapper";
import { formatPrice } from "@/lib/utils";

// Define the interface for inventory items
interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku: string;
  category_id?: string;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
  editing_locked?: boolean;
  labels_printed?: boolean;
  [key: string]: any; // For any additional properties
}

export default function EditListingPage() {
  const [item, setItem] = useState<InventoryItem | null>(null);
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
    setItem((prev: InventoryItem | null) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]:
          name === "price" || name === "quantity" ? parseFloat(value) : value,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Guard clause - if item is null, we can't proceed
      if (!item) {
        setError("Item data is missing");
        setIsSubmitting(false);
        return;
      }

      // Check if the item has labels printed
      if (item.editing_locked) {
        setError(
          "This item has already had labels printed and can no longer be edited.",
        );
        setIsSubmitting(false);
        return;
      }

      // Create form data to submit to server action
      const formData = new FormData();
      formData.append("id", itemId);
      formData.append("name", item.name);
      formData.append("price", item.price.toString());
      formData.append("category", item.category);
      formData.append("description", item.description || "");
      formData.append("quantity", item.quantity.toString());
      formData.append("condition", item.condition || "Good");

      // Submit to server action
      const response = await fetch("/api/update-inventory", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update item");
      }

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
      <LayoutWrapper>
        <SellerNavbar />
        <MainContent className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-pink-600" />
            <p className="text-gray-600">Loading item details...</p>
          </div>
        </MainContent>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <SellerNavbar />
        <MainContent>
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
        </MainContent>
      </LayoutWrapper>
    );
  }

  if (success) {
    return (
      <LayoutWrapper>
        <SellerNavbar />
        <MainContent>
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
        </MainContent>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <SellerNavbar />
      <MainContent>
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
              {item?.editing_locked && (
                <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md text-sm">
                  This item has had labels printed and can no longer be edited.
                </div>
              )}
              {item && !item.editing_locked && (
                <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded-md text-sm">
                  You can edit this item until labels are printed. Once labels
                  are printed, the item details will be locked.
                </div>
              )}
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
                      disabled={item?.editing_locked}
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
                      value={item?.price || ""}
                      onChange={handleInputChange}
                      placeholder="15.99"
                      required
                      disabled={item?.editing_locked}
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
                      disabled={item?.editing_locked}
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
                      disabled={item?.editing_locked}
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
                      disabled={item?.editing_locked}
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="listing_info">Listing Type</Label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">
                        {item?.listing_type === "self"
                          ? "Self-Listing"
                          : "Staff-Managed"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Commission Rate:{" "}
                        {item
                          ? (item.commission_rate * 100).toFixed(0)
                          : "15"}
                        %
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {item?.listing_type === "self"
                          ? "You are responsible for managing all item details and photos. You can edit items until labels are printed."
                          : "Our staff will handle the listing process for you."}
                      </p>
                      <p className="text-xs text-amber-600 mt-2">
                        Note: Listing type cannot be changed after cubby rental.
                      </p>
                      <input
                        type="hidden"
                        name="listing_type"
                        value={item?.listing_type || "self"}
                      />
                    </div>
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
                      disabled={item?.editing_locked}
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
                    disabled={isSubmitting || item?.editing_locked}
                  >
                    {isSubmitting ? "Updating..." : "Update Item"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}
