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
import {
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InventoryTablePagination } from "./inventory-table-pagination";
import { InventoryTableRow } from "./inventory-table-row";
import { InventoryEmptyState } from "./inventory-empty-state";
import { formatPrice } from "@/lib/utils";

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
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
}

export default function InventoryTable({
  items = [],
  totalItems,
  currentPage,
  onPageChange,
  itemsPerPage,
}: InventoryTableProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Function to determine stock status and badge color
  const getStockStatus = (quantity: number) => {
    if (quantity <= 0) {
      return { label: "Out of Stock", variant: "destructive" };
    } else {
      return { label: "In Stock", variant: "success" };
    }
  };

  // Format date to be more readable (day/month/year)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Use the centralized formatPrice utility function

  // Calculate start and end item numbers for display
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

  return (
    <div>
      {items.length === 0 ? (
        <InventoryEmptyState />
      ) : (
        <>
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
              {items.map((item) => (
                <InventoryTableRow
                  key={item.id}
                  item={item}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                  getStockStatus={getStockStatus}
                />
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {totalItems > itemsPerPage && (
            <InventoryTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              startItem={startItem}
              endItem={endItem}
              totalItems={totalItems}
            />
          )}
        </>
      )}
    </div>
  );
}
