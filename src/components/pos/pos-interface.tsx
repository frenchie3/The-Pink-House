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

// Simple helper function
function removeCartQuantity(item: any) {
  if (item && item.cartQuantity !== undefined) {
    const { cartQuantity, ...rest } = item;
    return rest;
  }
  return item;
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

  // Simplified synchronization effect
  useEffect(() => {
    // Only update filtered items when cart changes
    if (cart.length === 0) {
      // If cart is empty, reset all cartQuantity values
      setFilteredItems((prevItems) =>
        prevItems.map((item) => {
          if (item.cartQuantity !== undefined) {
            const { cartQuantity, ...rest } = item;
            return rest;
          }
          return item;
        }),
      );
    }
  }, [cart.length]);

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

  // Handle adding item to cart - simplified version
  const addToCart = useCallback(
    (item: InventoryItem) => {
      // Always add 1 when clicking the cart button
      const quantityToAdd = 1;

      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex(
          (cartItem) => cartItem.id === item.id,
        );

        if (existingItemIndex >= 0) {
          // Item already in cart, increment by 1
          const updatedCart = [...prevCart];
          const existingItem = updatedCart[existingItemIndex];

          // Increment by 1, respecting the max quantity
          existingItem.cartQuantity = Math.min(
            existingItem.cartQuantity + 1,
            existingItem.quantity,
          );

          return updatedCart;
        } else {
          // Add new item to cart with quantity 1
          return [...prevCart, { ...item, cartQuantity: quantityToAdd }];
        }
      });

      // Update the filtered items to show the item is in cart
      setFilteredItems((prevItems) =>
        prevItems.map((prevItem) => {
          if (prevItem.id === item.id) {
            // Get current quantity from cart or default to 1
            const cartItem = cart.find((ci) => ci.id === item.id);
            const newQuantity = cartItem ? cartItem.cartQuantity + 1 : 1;
            return {
              ...prevItem,
              cartQuantity: Math.min(newQuantity, prevItem.quantity),
            };
          }
          return prevItem;
        }),
      );
    },
    [cart, setCart, setFilteredItems],
  );

  // Handle removing item from cart - memoized to prevent recreation on each render
  const removeFromCart = useCallback(
    (itemId: string) => {
      console.log("Removing from cart:", itemId);

      // Remove the item from the cart
      setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

      // Reset the cartQuantity in filteredItems to undefined so it shows the add button
      setFilteredItems((prevItems) => {
        return prevItems.map((item) => {
          if (item.id === itemId) {
            // Create a completely new object without cartQuantity
            const { cartQuantity, ...rest } = item;
            return rest;
          }
          return item;
        });
      });
    },
    [setCart, setFilteredItems],
  );

  // Handle updating cart item quantity - memoized to prevent recreation on each render
  const updateCartItemQuantity = useCallback(
    (itemId: string, newQuantity: number) => {
      // If quantity is 0, remove the item
      if (newQuantity === 0) {
        // Remove from cart
        setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));

        // Reset the item in filteredItems
        setFilteredItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, cartQuantity: undefined } : item,
          ),
        );
        return;
      }

      // Otherwise update the quantity
      setCart((prevCart) => {
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
    [setCart, setFilteredItems],
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
