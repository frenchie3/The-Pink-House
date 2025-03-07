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
import { Eye, MoreHorizontal, Printer, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Sale {
  id: string;
  sale_date: string;
  total_amount: number;
  payment_method?: string;
  notes?: string;
  created_by?: string;
}

interface SalesTableProps {
  sales: Sale[];
}

export default function SalesTable({ sales = [] }: SalesTableProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
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
      {sales.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No sales records found</p>
          <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
            Record Your First Sale
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sale ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">
                  {sale.id.substring(0, 8)}...
                </TableCell>
                <TableCell>{formatDate(sale.sale_date)}</TableCell>
                <TableCell className="font-medium">
                  {formatPrice(sale.total_amount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`
                      ${sale.payment_method === "cash" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}
                      ${sale.payment_method === "card" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}
                      ${!sale.payment_method || sale.payment_method === "other" ? "bg-gray-100 text-gray-800 hover:bg-gray-100" : ""}
                    `}
                  >
                    {sale.payment_method || "Other"}
                  </Badge>
                </TableCell>
                <TableCell>{sale.notes || "—"}</TableCell>
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
                        <Receipt className="mr-2 h-4 w-4" />
                        View Receipt
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Receipt
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
