"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Trash2, CreditCard } from "lucide-react";
import { memo } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  cartQuantity: number;
  quantity: number; // Available stock
  sku: string;
}

interface POSCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  cartTotal: number;
  onCheckout: () => void;
}

// Memoized to prevent re-renders when parent components update but cart items don't change
const POSCart = memo(function POSCart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  cartTotal,
  onCheckout,
}: POSCartProps) {
  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Shopping Cart
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-0">
        {cartItems.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">
              Add items by clicking the cart icon on products
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">SKU: {item.sku}</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="flex items-center">
                  <div className="flex items-center border rounded-md mr-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cartQuantity - 1)
                      }
                      disabled={item.cartQuantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {item.cartQuantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() =>
                        onUpdateQuantity(item.id, item.cartQuantity + 1)
                      }
                      disabled={item.cartQuantity >= item.quantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-red-500"
                    onClick={() => onRemoveItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col pt-6">
        <div className="w-full space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-medium">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Tax</span>
            <span className="font-medium">{formatPrice(0)}</span>
          </div>
          <div className="flex justify-between text-base font-medium pt-2 border-t">
            <span>Total</span>
            <span>{formatPrice(cartTotal)}</span>
          </div>
        </div>
        <Button
          className="w-full bg-teal-600 hover:bg-teal-700"
          size="lg"
          onClick={onCheckout}
          disabled={cartItems.length === 0}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Checkout
        </Button>
      </CardFooter>
    </Card>
  );
});

export default POSCart;
