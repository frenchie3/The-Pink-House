"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../supabase/client";
import { UserRole } from "@/types/roles";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/",
}: RoleGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkUserRole() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.href = redirectTo;
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user role:", userError);
          window.location.href = redirectTo;
          return;
        }

        const userRole = userData.role as UserRole;
        const hasPermission = allowedRoles.includes(userRole);

        if (!hasPermission) {
          window.location.href = "/";
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error in role guard:", error);
        window.location.href = redirectTo;
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, [supabase, allowedRoles, redirectTo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <span className="ml-2 text-lg">Checking permissions...</span>
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
}
