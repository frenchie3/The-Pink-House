"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  BoxIcon,
  Search,
  QrCode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Receipt,
  Printer,
  Tag,
  AlertCircle,
  Filter,
} from "lucide-react";
import POSItemGrid from "./pos-item-grid";
import POSCart from "./pos-cart";
import POSPaymentModal from "./pos-payment-modal";
import POSBarcodeScanner from "./pos-barcode-scanner";
import POSCategoryFilter from "./pos-category-filter";
import POSCubbyFilter from "./pos-cubby-filter";

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
  const supabase = createClient();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filteredItems, setFilteredItems] =
    useState<InventoryItem[]>(inventoryItems);
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("grid");

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

  // Apply filters when search, category, or cubby changes
  useEffect(() => {
    let filtered = inventoryItems;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.barcode && item.barcode.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)),
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply cubby filter
    if (selectedCubby) {
      filtered = filtered.filter(
        (item) => item.cubby_location === selectedCubby,
      );
    }

    // Only show items with quantity > 0
    filtered = filtered.filter((item) => item.quantity > 0);

    setFilteredItems(filtered);

    // No longer checking for low stock items as most sellers will only have one item
    setLowStockAlerts([]);
  }, [searchQuery, selectedCategory, selectedCubby, inventoryItems]);

  // Handle adding item to cart
  const addToCart = (item: InventoryItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.id === item.id,
      );

      if (existingItemIndex >= 0) {
        // Item already in cart, increase quantity if possible
        const updatedCart = [...prevCart];
        const existingItem = updatedCart[existingItemIndex];

        if (existingItem.cartQuantity < existingItem.quantity) {
          existingItem.cartQuantity += 1;
        }

        return updatedCart;
      } else {
        // Add new item to cart
        return [...prevCart, { ...item, cartQuantity: 1 }];
      }
    });
  };

  // Handle removing item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  // Handle updating cart item quantity
  const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId
          ? { ...item, cartQuantity: Math.min(newQuantity, item.quantity) }
          : item,
      ),
    );
  };

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

  // Process payment and complete sale (fake payment processing)
  const processSale = async (paymentMethod: string) => {
    try {
      // 1. Create sale record - payment always succeeds
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          sale_date: new Date().toISOString(),
          total_amount: cartTotal,
          payment_method: paymentMethod,
          created_by: userId,
        })
        .select();

      if (saleError || !sale || sale.length === 0) {
        throw new Error(saleError?.message || "Failed to create sale record");
      }

      const saleId = sale[0].id;

      // 2. Create sale items
      const saleItems = cart.map((item) => ({
        sale_id: saleId,
        inventory_item_id: item.id,
        quantity: item.cartQuantity,
        price_sold: item.price,
      }));

      const { error: saleItemsError } = await supabase
        .from("sale_items")
        .insert(saleItems);

      if (saleItemsError) {
        throw new Error(saleItemsError.message);
      }

      // 3. Update inventory quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ quantity: item.quantity - item.cartQuantity })
          .eq("id", item.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      }

      // 4. Clear cart and close payment modal
      setCart([]);
      setIsPaymentModalOpen(false);

      // 5. Show success message or print receipt
      alert("Sale completed successfully!");

      // Refresh inventory data (in a real app, you might use a more efficient approach)
      window.location.reload();
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
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <Input
                  type="search"
                  placeholder="Search by name, SKU, or barcode..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Barcode Scanner Button */}
              <Button
                onClick={() => setIsScanning(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <QrCode className="mr-2 h-5 w-5" />
                Scan Barcode
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Filters:
                </span>
              </div>

              {/* Category Filter */}
              <POSCategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* Cubby Filter */}
              <POSCubbyFilter
                cubbyLocations={cubbyLocations}
                selectedCubby={selectedCubby}
                onSelectCubby={setSelectedCubby}
              />

              {/* Clear Filters */}
              {(selectedCategory || selectedCubby || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedCubby(null);
                    setSearchQuery("");
                  }}
                  className="ml-auto"
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Low Stock Alerts removed as most sellers will only have one item */}

            {/* Tabs for different views */}
            <Tabs
              defaultValue="grid"
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="grid">Grid View</TabsTrigger>
                <TabsTrigger value="list">List View</TabsTrigger>
              </TabsList>

              <TabsContent value="grid" className="mt-0">
                <POSItemGrid
                  items={filteredItems}
                  onAddToCart={addToCart}
                  activeTab={activeTab}
                />
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                <POSItemGrid
                  items={filteredItems}
                  onAddToCart={addToCart}
                  activeTab={activeTab}
                />
              </TabsContent>
            </Tabs>
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
