"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Lock, Edit, RefreshCcw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

// Types
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  cubby_id: string;
  editing_locked: boolean;
  labels_printed: boolean;
}

interface InventoryTableProps {
  items: InventoryItem[];
  rentalId: string;
}

export function InventoryTable({ items, rentalId }: InventoryTableProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(
    items.map(item => item.id)
  );
  const [printing, setPrinting] = useState(false);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };
  
  const handleItemSelect = (itemId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const isAllSelected = selectedItems.length === items.length && items.length > 0;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < items.length;

  const handlePrintLabels = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setPrinting(true);
      
      // Call API endpoint to print labels
      const response = await fetch('/api/inventory/print-labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: selectedItems })
      });
      
      if (!response.ok) {
        throw new Error('Failed to print labels');
      }
      
      // Show success message and refresh the page
      alert('Labels printed successfully!');
      window.location.reload();
      
    } catch (error) {
      console.error('Error printing labels:', error);
      alert('Failed to print labels. Please try again.');
    } finally {
      setPrinting(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <form id="print-labels-form">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id={`select-all-${rentalId}`}
                      className="select-all-checkbox"
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label
                      htmlFor={`select-all-${rentalId}`}
                      className="ml-2 text-xs"
                    >
                      Select All
                    </Label>
                  </div>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox 
                      id={`item-${item.id}`}
                      name="item_ids"
                      value={item.id}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleItemSelect(item.id, !!checked)}
                      // Staff can select any item, not limited by editing_locked
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.name}
                  </TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{formatPrice(item.price)}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {item.editing_locked && (
                        <Badge variant="secondary">
                          <Lock className="h-3 w-3 mr-1" /> Locked
                        </Badge>
                      )}
                      {item.labels_printed && (
                        <Badge variant="outline">
                          <Printer className="h-3 w-3 mr-1" />{" "}
                          Labeled
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/staff/inventory/edit/${item.id}`}>
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </form>
      </div>
      
      <div className="flex justify-end mt-4 gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {selectedItems.length} item(s) selected
          </span>
          <Button
            type="button"
            className="bg-pink-600 hover:bg-pink-700"
            onClick={handlePrintLabels}
            disabled={selectedItems.length === 0 || printing}
          >
            <Printer className="mr-2 h-4 w-4" />
            {printing ? "Printing..." : "Print Labels"}
          </Button>
        </div>
      </div>
    </>
  );
} 