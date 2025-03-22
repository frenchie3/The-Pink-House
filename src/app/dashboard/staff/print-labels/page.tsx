"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "../../../../../supabase/client";
import "./print-labels.css";

interface Cubby {
  id: string;
  cubby_number: string;
  location?: string;
}

interface Seller {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
}

interface CubbyRental {
  id: string;
  cubby_id: string;
  seller_id: string;
  status: string;
  cubby: Cubby | Cubby[];
  seller: Seller | Seller[];
}

// Helper function to get property from potentially array fields
const getProperty = <T,>(obj: T | T[] | null | undefined, property: keyof T): any => {
  if (!obj) return null;
  
  if (Array.isArray(obj)) {
    return obj[0]?.[property] ?? null;
  }
  
  return obj[property] ?? null;
};

export default function PrintLabelsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRentals, setActiveRentals] = useState<any[]>([]);
  const [itemsByCubby, setItemsByCubby] = useState<Record<string, any[]>>({});
  const [selectedItems, setSelectedItems] = useState<
    Record<string, Set<string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [processingItems, setProcessingItems] = useState<Set<string>>(
    new Set(),
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const supabase = createClient();

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Fetch active rentals
        const { data: rentals, error: rentalsError } = await supabase
          .from("cubby_rentals")
          .select("*, cubby:cubbies(*), seller:users(full_name, name, email)")
          .eq("status", "active");

        if (rentalsError) throw rentalsError;

        // Fetch unlocked inventory items
        const { data: items, error: itemsError } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("editing_locked", false)
          .order("cubby_id", { ascending: true });

        if (itemsError) throw itemsError;

        // Group items by cubby
        const itemsMap: Record<string, any[]> = {};
        const initialSelectedItems: Record<string, Set<string>> = {};

        items?.forEach((item) => {
          if (!item.cubby_id) return;

          if (!itemsMap[item.cubby_id]) {
            itemsMap[item.cubby_id] = [];
            initialSelectedItems[item.cubby_id] = new Set();
          }
          itemsMap[item.cubby_id].push(item);
        });

        setActiveRentals(rentals || []);
        setItemsByCubby(itemsMap);
        setSelectedItems(initialSelectedItems);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Handle individual item selection
  const handleItemSelect = (
    cubbyId: string,
    itemId: string,
    checked: boolean,
  ) => {
    setSelectedItems((prev: Record<string, Set<string>>) => {
      const newSelectedItems = { ...prev };

      if (!newSelectedItems[cubbyId]) {
        newSelectedItems[cubbyId] = new Set();
      }

      if (checked) {
        newSelectedItems[cubbyId].add(itemId);
      } else {
        newSelectedItems[cubbyId].delete(itemId);
      }

      return newSelectedItems;
    });
  };

  // Handle select all for a cubby
  const handleSelectAll = (cubbyId: string, checked: boolean) => {
    setSelectedItems((prev: Record<string, Set<string>>) => {
      const newSelectedItems = { ...prev };

      if (!newSelectedItems[cubbyId]) {
        newSelectedItems[cubbyId] = new Set();
      }

      if (checked) {
        // Select all items in this cubby
        itemsByCubby[cubbyId]?.forEach((item) => {
          if (item && item.id) {
            newSelectedItems[cubbyId].add(item.id);
          }
        });
      } else {
        // Deselect all items in this cubby
        newSelectedItems[cubbyId].clear();
      }

      return newSelectedItems;
    });
  };

  // Check if all items in a cubby are selected
  const areAllSelected = (cubbyId: string) => {
    const items = itemsByCubby[cubbyId] || [];
    const selected = selectedItems[cubbyId] || new Set();
    return items.length > 0 && selected.size === items.length;
  };

  // Check if some (but not all) items in a cubby are selected
  const areSomeSelected = (cubbyId: string) => {
    const selected = selectedItems[cubbyId] || new Set();
    return selected.size > 0 && !areAllSelected(cubbyId);
  };

  // Get count of selected items for a cubby
  const getSelectedCount = (cubbyId: string) => {
    return (selectedItems[cubbyId] || new Set()).size;
  };

  // Handle form submission
  const handleSubmit = async (cubbyId: string) => {
    try {
      setSubmitting(true);
      setError(null);

      const selected = Array.from(selectedItems[cubbyId] || new Set());

      if (selected.length === 0) {
        setError("Please select at least one item");
        return;
      }

      // Mark items as processing (for animation)
      setProcessingItems(new Set(selected));

      // Update the database
      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({
          editing_locked: true,
          labels_printed: true,
        })
        .in("id", selected);

      if (updateError) throw updateError;

      // Wait for animation to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Update local state to remove processed items
      setItemsByCubby((prev) => {
        const newItemsByCubby = { ...prev };

        // Remove the processed items from each cubby
        if (newItemsByCubby[cubbyId]) {
          newItemsByCubby[cubbyId] = newItemsByCubby[cubbyId].filter(
            (item) => !selected.includes(item.id),
          );
        }

        return newItemsByCubby;
      });

      // Clear selection for this cubby
      setSelectedItems((prev) => {
        const newSelectedItems = { ...prev };
        if (newSelectedItems[cubbyId]) {
          newSelectedItems[cubbyId] = new Set();
        }
        return newSelectedItems;
      });

      // Set success message
      setSuccessMessage(
        `${selected.length} item${selected.length !== 1 ? "s" : ""} successfully processed and locked for editing.`,
      );

      // Clear processing items
      setProcessingItems(new Set());
    } catch (err) {
      console.error("Error updating items:", err);
      setError("Failed to update items. Please try again.");
      // Clear processing items on error
      setProcessingItems(new Set());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-pink-600" />
              <p className="text-gray-600">Loading items...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Print Labels</h1>
              <p className="text-gray-600 mt-1">
                Print labels for items and lock them for editing
              </p>
            </div>

            <Link href="/dashboard/staff">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
              <div className="h-5 w-5 flex-shrink-0">⚠️</div>
              {error}
            </div>
          )}

          {(success || successMessage) && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-md flex items-center gap-2 success-message">
              <CheckCircle className="h-5 w-5" />
              {successMessage ||
                "Labels printed successfully! Selected items have been locked for editing."}
            </div>
          )}

          {/* Cubbies with Items */}
          <div className="space-y-8">
            {activeRentals.map((rental) => {
              const cubbyItems = itemsByCubby[rental.cubby_id] || [];
              const hasUnlockedItems = cubbyItems.length > 0;

              if (!hasUnlockedItems) return null;

              // Modify the mapping function for rental card headers
              // Replace the original rental.cubby?.cubby_number with a safer access
              const cubbyNumber = getProperty(rental.cubby, 'cubby_number');
              const sellerName = getProperty(rental.seller, 'full_name') || 
                                 getProperty(rental.seller, 'name') || 
                                 "Unknown Seller";

              return (
                <Card key={rental.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        Cubby #{cubbyNumber} -
                        {sellerName}
                      </div>
                      <div className="text-sm font-normal text-gray-500">
                        {cubbyItems.length} unlocked item(s)
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <Checkbox
                                    id={`select-all-${rental.cubby_id}`}
                                    className="select-all-checkbox"
                                    checked={areAllSelected(rental.cubby_id)}
                                    ref={(input) => {
                                      if (input) {
                                        input.indeterminate = areSomeSelected(
                                          rental.cubby_id,
                                        );
                                      }
                                    }}
                                    onCheckedChange={(checked) => {
                                      handleSelectAll(
                                        rental.cubby_id,
                                        checked === true,
                                      );
                                    }}
                                  />
                                  <Label
                                    htmlFor={`select-all-${rental.cubby_id}`}
                                    className="ml-2 text-xs"
                                  >
                                    Select All
                                  </Label>
                                </div>
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Item
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                SKU
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Price
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cubbyItems.map((item) => (
                              <tr
                                key={item.id}
                                className={`hover:bg-gray-50 ${processingItems.has(item.id) ? "processing-item" : ""}`}
                              >
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <Checkbox
                                    id={`item-${item.id}`}
                                    value={item.id}
                                    className="item-checkbox"
                                    checked={
                                      selectedItems[rental.cubby_id]?.has(
                                        item.id,
                                      ) || false
                                    }
                                    onCheckedChange={(checked) => {
                                      handleItemSelect(
                                        rental.cubby_id,
                                        item.id,
                                        checked === true,
                                      );
                                    }}
                                  />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {item.sku}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                  £{item.price.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                  {item.quantity}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex justify-end mt-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">
                            {getSelectedCount(rental.cubby_id)} item(s) selected
                          </span>
                          <Button
                            type="button"
                            className="bg-pink-600 hover:bg-pink-700 print-labels-btn"
                            disabled={
                              getSelectedCount(rental.cubby_id) === 0 ||
                              submitting
                            }
                            onClick={() => handleSubmit(rental.cubby_id)}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Print Labels & Lock Items
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* No items to print */}
            {(!activeRentals.length ||
              !activeRentals.some(
                (rental) => (itemsByCubby[rental.cubby_id] || []).length > 0,
              )) && (
              <Card>
                <CardContent className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">
                    No unlocked items available for label printing
                  </p>
                  <p className="text-sm text-gray-400">
                    All items have already had their labels printed or there are
                    no items in the system.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Refresh button when all items are processed */}
            {activeRentals.length > 0 &&
              !activeRentals.some(
                (rental) => (itemsByCubby[rental.cubby_id] || []).length > 0,
              ) &&
              successMessage && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 2v6h-6"></path>
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                      <path d="M3 22v-6h6"></path>
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                    </svg>
                    Refresh Page
                  </Button>
                </div>
              )}
          </div>
        </div>
      </main>
    </>
  );
}
