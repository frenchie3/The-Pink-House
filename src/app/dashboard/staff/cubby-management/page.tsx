import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Filter, AlertCircle, Clock, List } from "lucide-react";
import Link from "next/link";
import DashboardNavbar from "@/components/dashboard-navbar";
import CubbyCalendarView from "@/components/staff/cubby-calendar-view";
import CubbyManagementClient from "./client";

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

export default async function CubbyManagementPage() {
  const supabase = createClient();

  try {
    // Server-side authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      redirect('/sign-in');
    }

    // Server-side role check
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) throw roleError;
    if (!userData || userData.role !== 'staff') {
      redirect('/dashboard');
    }

    // Fetch cubbies
    const { data: cubbies, error: cubbiesError } = await supabase
      .from('cubbies')
      .select('*')
      .order('cubby_number');

    if (cubbiesError) throw cubbiesError;

    // Fetch rentals
    const { data: rentals, error: rentalsError } = await supabase
      .from('cubby_rentals')
      .select(`
        *,
        seller:users!cubby_rentals_seller_id_fkey(full_name, email),
        cubby:cubbies!cubby_rentals_cubby_id_fkey(cubby_number, location)
      `)
      .order('end_date', { ascending: true });

    if (rentalsError) throw rentalsError;

    return <CubbyManagementClient cubbies={cubbies || []} rentals={rentals || []} />;
  } catch (error) {
    console.error('Error in CubbyManagementPage:', error);
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center text-red-600">
          <p>An error occurred. Please try again later.</p>
        </div>
      </div>
    );
  }
} 