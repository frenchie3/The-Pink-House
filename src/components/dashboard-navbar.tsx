"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  UserCircle,
  Home,
  BoxIcon,
  ShoppingBag,
  Package,
  BarChart3,
  Settings,
  CreditCard,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { useEffect, useState } from "react";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          setUserRole(userData?.role || null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  const getNavItems = () => {
    const baseItems = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <Home className="h-5 w-5" />,
      },
    ];

    const staffItems = [
      {
        href: "/dashboard/inventory",
        label: "Inventory",
        icon: <BoxIcon className="h-5 w-5" />,
      },
      {
        href: "/dashboard/pos",
        label: "Point of Sale",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        href: "/dashboard/staff/cubby-management",
        label: "Cubby Management",
        icon: <Package className="h-5 w-5" />,
      },
      {
        href: "/dashboard/sales",
        label: "Sales",
        icon: <ShoppingBag className="h-5 w-5" />,
      },
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ];

    const adminItems = [
      {
        href: "/dashboard/inventory",
        label: "Inventory",
        icon: <BoxIcon className="h-5 w-5" />,
      },
      {
        href: "/dashboard/pos",
        label: "Point of Sale",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        href: "/dashboard/sales",
        label: "Sales",
        icon: <ShoppingBag className="h-5 w-5" />,
      },
      {
        href: "/dashboard/reports",
        label: "Reports",
        icon: <BarChart3 className="h-5 w-5" />,
      },
    ];

    switch (userRole) {
      case "staff":
        return [...baseItems, ...staffItems];
      case "admin":
        return [...baseItems, ...adminItems];
      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  if (isLoading) {
    return (
      <nav className="w-full border-b border-gray-200 bg-white py-3">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/" prefetch className="text-xl font-bold text-teal-600 mr-6">
              Inventory
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            prefetch
            className="text-xl font-bold text-teal-600 mr-6"
          >
            Inventory
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname?.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden overflow-x-auto flex space-x-1 px-4 py-2 border-t border-gray-100">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center flex-shrink-0 ${
                isActive
                  ? "bg-teal-50 text-teal-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
