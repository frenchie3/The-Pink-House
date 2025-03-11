"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, QrCode, Filter } from "lucide-react";
import POSItemGrid from "./pos-item-grid";
import POSCart from "./pos-cart";
import POSPaymentModal from "./pos-payment-modal";
import POSBarcodeScanner from "./pos-barcode-scanner";
import POSCategoryFilter from "./pos-category-filter";
import POSCubbyFilter from "./pos-cubby-filter";
import { useProcessSale } from "@/hooks/use-sales";
import { POSSearchBar } from "./pos-search-bar";
import { POSFilterBar } from "./pos-filter-bar";
import { POSViewTabs } from "./pos-view-tabs";
import { useInventoryFilters } from "@/hooks/use-inventory-filters";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  location?: string;
  cubby_location?: string;
  date_added: string;
  image_url?: string;
  barcode?: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

interface POSInterfaceProps {
  inventoryItems: InventoryItem[];
  categories: Category[];
  userId: string;
}

export default function POSInterface({
  inventoryItems,
  categories,
  userId,
}: POSInterfaceProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("grid");

  // Use custom hook for filtering inventory items
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCubby,
    setSelectedCubby,
    filteredItems,
    setFilteredItems,
    resetFilters,
  } = useInventoryFilters(inventoryItems);

  // Extract unique cubby locations
  const cubbyLocations = Array.from(
    new Set(
      inventoryItems
        .map((item) => item.cubby_location)
        .filter((location): location is string => !!location),
    ),
  );

  // Calculate cart totals
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.cartQuantity,
    0,
  );

  // Handle adding item to cart - memoized to prevent recreation on each render
  const addToCart = useCallback((item: InventoryItem) => {
    // If item has cartQuantity already set, use that value (for the update case)
    // If cartQuantity is undefined, default to 1 (adding a new item)
    const quantityToAdd =
      item.cartQuantity !== undefined ? item.cartQuantity : 1;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.id === item.id,
      );

      if (existingItemIndex >= 0) {
        // Item already in cart, set to the specified quantity or increase by 1
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];

        if (item.cartQuantity !== undefined) {
          // If quantity is 0, remove the item
          if (item.cartQuantity === 0) {
            return updatedCart.filter((item) => item.id !== existingItem.id);
          }
          // Otherwise set to the specified quantity
          existingItem.cartQuantity = Math.min(
            item.cartQuantity,
            existingItem.quantity,
          );
        } else if (existingItem.cartQuantity < existingItem.quantity) {
          // Increase by 1 if no specific quantity provided
          existingItem.cartQuantity += 1;
        }

        return updatedCart;
      } else if (quantityToAdd > 0) {
        // Add new item to cart with the specified quantity
        return [...prevCart, { ...item, cartQuantity: quantityToAdd }];
      } else {
        // If quantity is 0 and item not in cart, don't add it
        return prevCart;
      }
    });

    // Update the cartQuantity in the filteredItems for UI updates
    setFilteredItems((prevItems) =>
      prevItems.map((prevItem) =>
        prevItem.id === item.id
          ? {
              ...prevItem,
              cartQuantity:
                item.cartQuantity !== undefined
                  ? item.cartQuantity
                  : (prevItem.cartQuantity || 0) + 1,
            }
          : prevItem,
      ),
    );
  }, []);

  // Handle removing item from cart - memoized to prevent recreation on each render
  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

    // Reset the cartQuantity in filteredItems to undefined so it shows the add button
    setFilteredItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, cartQuantity: undefined } : item,
      ),
    );
  }, []);

  // Handle updating cart item quantity - memoized to prevent recreation on each render
  const updateCartItemQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      setCart((prevCart) => {
        // If quantity is 0, remove the item
        if (newQuantity === 0) {
          return prevCart.filter((item) => item.id !== itemId);
        }

        // Otherwise update the quantity
        return prevCart.map((item) =>
          item.id === itemId
            ? { ...item, cartQuantity: Math.min(newQuantity, item.quantity) }
            : item,
        );
      });

      // Also update the cartQuantity in filteredItems for UI consistency
      setFilteredItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, cartQuantity: newQuantity } : item,
        ),
      );
    },
    [],
  );

  // Handle barcode scanning
  const handleBarcodeScanned = (barcode: string) => {
    const item = inventoryItems.find(
      (item) => item.barcode === barcode || item.sku === barcode,
    );
    if (item) {
      addToCart(item);
    }
    setIsScanning(false);
  };

  // Use the process sale mutation hook
  const processSaleMutation = useProcessSale();

  // Process payment and complete sale
  const processSale = async (paymentMethod: string) => {
    try {
      await processSaleMutation.mutateAsync({
        cartItems: cart,
        cartTotal,
        paymentMethod,
        userId,
      });

      // Clear cart and close payment modal
      setCart([]);
      setIsPaymentModalOpen(false);

      // Show success message
      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Error processing sale:", error);
      alert(
        `Error processing sale: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side - Items */}
        <div className="lg:w-2/3">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
            {/* Search Bar Component */}
            <POSSearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setIsScanning={setIsScanning}
            />

            {/* Filters Component */}
            <POSFilterBar
              categories={categories}
              cubbyLocations={cubbyLocations}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedCubby={selectedCubby}
              setSelectedCubby={setSelectedCubby}
              hasActiveFilters={
                !!(selectedCategory || selectedCubby || searchQuery)
              }
              resetFilters={resetFilters}
            />

            {/* View Tabs Component */}
            <POSViewTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              filteredItems={filteredItems}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Right Side - Cart */}
        <div className="lg:w-1/3">
          <POSCart
            cartItems={cart}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            cartTotal={cartTotal}
            onCheckout={() => setIsPaymentModalOpen(true)}
          />
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      {isScanning && (
        <POSBarcodeScanner
          onClose={() => setIsScanning(false)}
          onScan={handleBarcodeScanned}
        />
      )}

      {/* Payment Modal */}
      <POSPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        cartTotal={cartTotal}
        onProcessPayment={processSale}
      />
    </div>
  );
}
