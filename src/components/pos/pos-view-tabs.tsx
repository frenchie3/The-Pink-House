"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import POSItemGrid from "./pos-item-grid";

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
  cartQuantity?: number;
}

interface POSViewTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  filteredItems: InventoryItem[];
  onAddToCart: (item: InventoryItem) => void;
}

export function POSViewTabs({
  activeTab,
  setActiveTab,
  filteredItems,
  onAddToCart,
}: POSViewTabsProps) {
  return (
    <Tabs
      defaultValue="grid"
      className="w-full"
      onValueChange={setActiveTab}
      value={activeTab}
    >
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="grid">Grid View</TabsTrigger>
        <TabsTrigger value="list">List View</TabsTrigger>
      </TabsList>

      <TabsContent value="grid" className="mt-0">
        <POSItemGrid
          items={filteredItems}
          onAddToCart={onAddToCart}
          onUpdateQuantity={(itemId, quantity) => {
            // This will be handled by the parent component
            const item = filteredItems.find((item) => item.id === itemId);
            if (item) {
              const updatedItem = { ...item, cartQuantity: quantity };
              onAddToCart(updatedItem);
            }
          }}
          activeTab={activeTab}
        />
      </TabsContent>

      <TabsContent value="list" className="mt-0">
        <POSItemGrid
          items={filteredItems}
          onAddToCart={onAddToCart}
          onUpdateQuantity={(itemId, quantity) => {
            // This will be handled by the parent component
            const item = filteredItems.find((item) => item.id === itemId);
            if (item) {
              const updatedItem = { ...item, cartQuantity: quantity };
              onAddToCart(updatedItem);
            }
          }}
          activeTab={activeTab}
        />
      </TabsContent>
    </Tabs>
  );
}
