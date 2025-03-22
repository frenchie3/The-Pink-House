"use client";

import { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import RoleGuard from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "../../../../../supabase/client";
import UserManagementTable from "@/components/admin/user-management-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types for our component
interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "staff" | "seller";
  created_at: string;
  email_verified: boolean;
}

const ROLES = ["admin", "staff", "seller"] as const;

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 3 months", days: 90 },
  { label: "All time", days: 0 },
] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDatePreset, setSelectedDatePreset] = useState<number>(0);
  
  const supabase = createClient();

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: users, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, created_at, email_verified")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    const newSelectedRoles = new Set(selectedRoles);
    if (newSelectedRoles.has(role)) {
      newSelectedRoles.delete(role);
    } else {
      newSelectedRoles.add(role);
    }
    setSelectedRoles(newSelectedRoles);
  };

  const clearFilters = () => {
    setSelectedRoles(new Set());
    setSelectedDatePreset(0);
  };

  // Filter users based on search query, roles, and date range
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRoles.size === 0 || selectedRoles.has(user.role);
    
    const userCreatedAt = new Date(user.created_at);
    let matchesDate = true;
    
    if (selectedDatePreset > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - selectedDatePreset);
      matchesDate = userCreatedAt >= cutoffDate;
    }
    
    return matchesSearch && matchesRole && matchesDate;
  });

  const getRoleBadgeColor = (role: string, isSelected: boolean) => {
    const baseColors = {
      admin: isSelected ? "bg-red-600 text-white" : "bg-red-100 text-red-800 border-red-200",
      staff: isSelected ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-800 border-blue-200",
      seller: isSelected ? "bg-green-600 text-white" : "bg-green-100 text-green-800 border-green-200",
    };
    return baseColors[role as keyof typeof baseColors] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="flex flex-col h-screen">
        <DashboardNavbar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="container mx-auto px-4 py-8">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage user roles and permissions
                </p>
              </div>
            </header>

            {/* Search and Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    type="search"
                    placeholder="Search users by email or name..."
                    className="pl-10 w-full bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={showFilters ? "default" : "outline"} 
                    className={`flex-shrink-0 ${showFilters ? "bg-pink-600 hover:bg-pink-700" : ""}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    Filters
                    {(selectedRoles.size > 0 || selectedDatePreset > 0) && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedRoles.size + (selectedDatePreset > 0 ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                  {(selectedRoles.size > 0 || selectedDatePreset > 0) && (
                    <Button
                      variant="outline"
                      className="flex-shrink-0"
                      onClick={clearFilters}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Filter Options */}
              {showFilters && (
                <div className="mt-4 space-y-4">
                  {/* Role Filters */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="text-sm text-gray-500 mr-2">Filter by role:</div>
                    {ROLES.map((role) => (
                      <Badge
                        key={role}
                        className={`cursor-pointer ${getRoleBadgeColor(role, selectedRoles.has(role))}`}
                        onClick={() => toggleRole(role)}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Badge>
                    ))}
                  </div>

                  {/* Date Presets */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="text-sm text-gray-500">Filter by join date:</div>
                    <div className="flex flex-wrap gap-2">
                      {DATE_PRESETS.map((preset) => (
                        <Button
                          key={preset.days}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "text-xs",
                            selectedDatePreset === preset.days
                              ? "bg-pink-600 text-white hover:bg-pink-700"
                              : ""
                          )}
                          onClick={() => setSelectedDatePreset(
                            selectedDatePreset === preset.days ? 0 : preset.days
                          )}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagementTable 
                  users={filteredUsers}
                  loading={loading}
                  onRefresh={fetchUsers}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
} 