import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { memo } from "react";

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

interface InventoryTableRowProps {
  item: InventoryItem;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
  getStockStatus: (quantity: number) => { label: string; variant: string };
}

// Memoized to prevent re-renders when table data doesn't change
export const InventoryTableRow = memo(function InventoryTableRow({
  item,
  formatPrice,
  formatDate,
  getStockStatus,
}: InventoryTableRowProps) {
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
      <TableCell>{item.cubby_location || item.location || "—"}</TableCell>
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
});
