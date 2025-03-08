"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../supabase/client";
import { Loader2 } from "lucide-react";

interface SellerGuardProps {
  children: React.ReactNode;
}

export default function SellerGuard({ children }: SellerGuardProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function checkSellerRole() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          window.location.href = "/sign-in";
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError || !userData) {
          console.error("Error fetching user role:", userError);
          window.location.href = "/sign-in";
          return;
        }

        if (userData.role !== "seller") {
          window.location.href = "/dashboard";
          return;
        }

        setHasAccess(true);
      } catch (error) {
        console.error("Error in seller guard:", error);
        window.location.href = "/sign-in";
      } finally {
        setLoading(false);
      }
    }

    checkSellerRole();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <span className="ml-2 text-lg">Loading seller dashboard...</span>
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
}
