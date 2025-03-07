"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, BoxIcon } from "lucide-react";
import Image from "next/image";

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

interface POSItemGridProps {
  items: InventoryItem[];
  onAddToCart: (item: InventoryItem) => void;
  activeTab: string;
}

export default function POSItemGrid({
  items,
  onAddToCart,
  activeTab,
}: POSItemGridProps) {
  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Function to determine stock status and badge color
  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) {
      return { label: "Out of Stock", variant: "destructive" };
    } else if (quantity < 5) {
      return { label: "Low Stock", variant: "warning" };
    } else {
      return { label: "In Stock", variant: "success" };
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <BoxIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">No items found matching your criteria</p>
      </div>
    );
  }

  return activeTab === "grid" ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const stockStatus = getStockStatus(item.quantity);
        return (
          <Card
            key={item.id}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-40 bg-gray-100">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Tag className="h-12 w-12 text-gray-300" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <Badge
                  variant={
                    stockStatus.variant as
                      | "default"
                      | "secondary"
                      | "destructive"
                      | "outline"
                      | "success"
                      | "warning"
                  }
                  className={`
                    ${stockStatus.variant === "success" ? "bg-green-100 text-green-800" : ""}
                    ${stockStatus.variant === "warning" ? "bg-amber-100 text-amber-800" : ""}
                    ${stockStatus.variant === "destructive" ? "bg-red-100 text-red-800" : ""}
                  `}
                >
                  {stockStatus.label}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              <div className="flex justify-between items-center mt-1">
                <div>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={() => onAddToCart(item)}
                  disabled={item.quantity <= 0}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
              {item.cubby_location && (
                <p className="text-xs text-gray-500 mt-2">
                  Cubby: {item.cubby_location}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  ) : (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Item
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              SKU
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Cubby
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Stock
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => {
            const stockStatus = getStockStatus(item.quantity);
            return (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <Tag className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.category}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.sku}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatPrice(item.price)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {item.cubby_location || "—"}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    variant={
                      stockStatus.variant as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                        | "success"
                        | "warning"
                    }
                    className={`
                      ${stockStatus.variant === "success" ? "bg-green-100 text-green-800" : ""}
                      ${stockStatus.variant === "warning" ? "bg-amber-100 text-amber-800" : ""}
                      ${stockStatus.variant === "destructive" ? "bg-red-100 text-red-800" : ""}
                    `}
                  >
                    {item.quantity} {item.quantity === 1 ? "item" : "items"}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    size="sm"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => onAddToCart(item)}
                    disabled={item.quantity <= 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
