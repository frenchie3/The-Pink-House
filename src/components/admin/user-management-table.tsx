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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createClient } from "../../../supabase/client";
import { Eye, MoreHorizontal, UserCog } from "lucide-react";
import { useState } from "react";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "staff" | "seller";
  created_at: string;
  email_verified: boolean;
}

interface UserManagementTableProps {
  users: User[];
  loading: boolean;
  onRefresh: () => void;
}

export default function UserManagementTable({ users, loading, onRefresh }: UserManagementTableProps) {
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      setError(null);

      // Get current user to check if they're modifying themselves
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Get count of admins
      const { count: adminCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      // Prevent last admin from being downgraded
      if (currentUser?.id === userId && newRole !== "admin" && adminCount === 1) {
        setError("Cannot remove the last admin user.");
        return;
      }

      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      onRefresh(); // Refresh the users list
    } catch (error) {
      console.error("Error updating user role:", error);
      setError("Failed to update user role. Please try again.");
    } finally {
      setUpdatingUserId(null);
      setSelectedRole("");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "seller":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name/Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Email Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{user.full_name || "No name"}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  className={user.email_verified 
                    ? "bg-green-100 text-green-800 border-green-200" 
                    : "bg-yellow-100 text-yellow-800 border-yellow-200"}
                >
                  {user.email_verified ? "Verified" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(user.created_at).toLocaleDateString("en-NZ", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={updatingUserId === user.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="flex items-center">
                          <UserCog className="mr-2 h-4 w-4" />
                          Change Role
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <DropdownMenuItem className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Change User Role</AlertDialogTitle>
                      <AlertDialogDescription>
                        Select a new role for {user.full_name || user.email}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex items-center gap-4">
                        {["admin", "staff", "seller"].map((role) => (
                          <Button
                            key={role}
                            variant={selectedRole === role ? "default" : "outline"}
                            className={`flex-1 ${selectedRole === role ? "bg-pink-600 hover:bg-pink-700" : ""}`}
                            onClick={() => setSelectedRole(role)}
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setSelectedRole("")}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => selectedRole && handleRoleUpdate(user.id, selectedRole)}
                        disabled={!selectedRole || selectedRole === user.role}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        Update Role
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 