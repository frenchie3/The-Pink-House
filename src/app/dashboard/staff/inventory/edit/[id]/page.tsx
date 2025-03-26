"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../../../../supabase/client";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
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
  category?: string;
  condition?: string;
  seller_id?: string;
  created_at?: string;
  updated_at?: string;
  editing_locked?: boolean;
  labels_printed?: boolean;
  [key: string]: any; // For any additional properties
}

export default function StaffEditItemPage() {
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

      // Create form data to submit to staff API endpoint
      const formData = new FormData();
      formData.append("id", itemId);
      formData.append("name", item.name);
      formData.append("price", item.price.toString());
      formData.append("category", item.category || "");
      formData.append("description", item.description || "");
      formData.append("quantity", item.quantity.toString());
      formData.append("condition", item.condition || "Good");

      // Submit to staff-specific API endpoint that bypasses the editing_locked check
      const response = await fetch("/api/staff/update-inventory", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update item");
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect back to the cubby details page if we have a referrer
        const referrer = document.referrer;
        if (referrer && referrer.includes("/dashboard/staff/cubby-management/")) {
          router.back();
        } else {
          router.push("/dashboard/staff");
        }
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
        <DashboardNavbar />
        <MainContent>
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </MainContent>
      </LayoutWrapper>
    );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <DashboardNavbar />
        <MainContent>
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Item</h2>
            <p className="text-gray-600">{error}</p>
            <Button
              className="mt-6"
              onClick={() => router.back()}
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </MainContent>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper>
      <DashboardNavbar />
      <MainContent>
        <div className="container mx-auto py-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold mb-2">Edit Item (Staff Access)</h1>
            <p className="text-gray-500">
              {item?.editing_locked ? (
                <span className="text-amber-600 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  This item is locked, but staff can make edits
                </span>
              ) : (
                "Update the details for this inventory item"
              )}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="bg-green-50 p-4 rounded-md text-green-800 mb-4">
                  Item updated successfully! Redirecting...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={item?.name || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item?.price || 0}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        name="quantity"
                        type="number"
                        min="0"
                        value={item?.quantity || 0}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      name="category"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={item?.category || ""}
                      onChange={handleInputChange}
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

                  <div>
                    <Label htmlFor="condition">Condition</Label>
                    <select
                      id="condition"
                      name="condition"
                      className="w-full p-2 border border-gray-300 rounded"
                      value={item?.condition || "Good"}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={item?.description || ""}
                      onChange={handleInputChange}
                      rows={4}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 p-4 rounded-md text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="mr-2"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-pink-600 hover:bg-pink-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
} 