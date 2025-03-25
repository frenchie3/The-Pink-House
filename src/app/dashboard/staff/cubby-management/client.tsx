"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, List } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import CubbyCalendarView from "@/components/staff/cubby-calendar-view";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types
interface CubbyRental {
  id: string;
  cubby_id: string;
  seller_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "pending_extension" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
  seller: {
    full_name: string;
    email: string;
  };
  cubby: {
    cubby_number: string;
    location: string;
  };
}

export default function CubbyManagementClient({
  cubbies,
  rentals,
}: {
  cubbies: any[];
  rentals: CubbyRental[];
}) {
  const [view, setView] = useState<"list" | "calendar">("list");

  // Calculate statistics
  const stats = {
    total: rentals?.length || 0,
    active: rentals?.filter((r) => r.status === "active").length || 0,
    expired: rentals?.filter((r) => r.status === "expired").length || 0,
    pending: rentals?.filter((r) => r.status === "pending_extension").length || 0,
  };

  // Helper functions
  const getSellerName = (rental: CubbyRental) => rental.seller?.full_name || "Unknown";
  const getSellerEmail = (rental: CubbyRental) => rental.seller?.email || "Unknown";
  const getCubbyNumber = (rental: CubbyRental) => rental.cubby?.cubby_number || "Unknown";
  const getCubbyLocation = (rental: CubbyRental) => rental.cubby?.location || "Unknown";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <DashboardNavbar />
      <main className="flex-1 bg-gray-50 overflow-auto">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Cubby Management</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage all cubby rentals
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={view === "list" ? "default" : "outline"}
                onClick={() => setView("list")}
              >
                <List className="mr-2 h-4 w-4" />
                List View
              </Button>
              <Button
                variant={view === "calendar" ? "default" : "outline"}
                onClick={() => setView("calendar")}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Calendar View
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Rentals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Active Rentals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Extensions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Expired Rentals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {stats.expired}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {view === "calendar" ? (
            <CubbyCalendarView 
              cubbies={cubbies} 
              rentals={rentals} 
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cubby</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rentals?.map((rental: CubbyRental) => (
                      <TableRow key={rental.id}>
                        <TableCell>
                          <div className="font-medium">
                            Cubby #{getCubbyNumber(rental)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getCubbyLocation(rental)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getSellerName(rental)}</div>
                          <div className="text-sm text-gray-500">
                            {getSellerEmail(rental)}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(rental.start_date)}</TableCell>
                        <TableCell>{formatDate(rental.end_date)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rental.status === "active"
                                ? "default"
                                : rental.status === "pending_extension"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {rental.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rental.payment_status === "paid"
                                ? "default"
                                : rental.payment_status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {rental.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/dashboard/staff/cubby-management/${rental.id}`}>
                                View Details
                              </Link>
                            </Button>
                            {rental.status === "pending_extension" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
} 