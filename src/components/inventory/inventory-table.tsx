"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
}

interface InventoryTableProps {
  items: InventoryItem[];
}

export default function InventoryTable({ items = [] }: InventoryTableProps) {
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

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format price with currency symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div>
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No inventory items found</p>
          <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
            Add Your First Item
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const stockStatus = getStockStatus(item.quantity);

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        stockStatus.variant as
                          | "default"
                          | "secondary"
                          | "destructive"
                          | "outline"
                      }
                      className={`
                        ${stockStatus.variant === "success" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                        ${stockStatus.variant === "warning" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" : ""}
                        ${stockStatus.variant === "destructive" ? "bg-red-100 text-red-800 hover:bg-red-100" : ""}
                      `}
                    >
                      {stockStatus.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.cubby_location || item.location || "—"}
                  </TableCell>
                  <TableCell>{formatDate(item.date_added)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Item
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
