"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Donation {
  id: string;
  donor_name?: string;
  donation_date: string;
  description?: string;
  estimated_value?: number;
  notes?: string;
  received_by?: string;
}

interface DonationsTableProps {
  donations: Donation[];
}

export default function DonationsTable({
  donations = [],
}: DonationsTableProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format price with currency symbol
  const formatPrice = (price?: number) => {
    if (!price) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <div>
      {donations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No donation records found</p>
          <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
            Record Your First Donation
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donation ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Estimated Value</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell className="font-medium">
                  {donation.id.substring(0, 8)}...
                </TableCell>
                <TableCell>{formatDate(donation.donation_date)}</TableCell>
                <TableCell>{donation.donor_name || "Anonymous"}</TableCell>
                <TableCell>{donation.description || "—"}</TableCell>
                <TableCell>{formatPrice(donation.estimated_value)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {donation.notes || "—"}
                </TableCell>
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
                        <Tag className="mr-2 h-4 w-4" />
                        Process Items
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
