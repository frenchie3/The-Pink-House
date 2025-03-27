"use client";

import * as React from "react";
import Link from "next/link";
import { createClient } from "../../supabase/client";
import { cn } from "@/lib/utils";
import {
  Home,
  Tag,
  DollarSign,
  CreditCard,
  Settings,
  Bell,
  HelpCircle,
  Menu,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeSwitcher } from "./theme-switcher";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useEffect, useState } from "react";

// Define the navigation item types
type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  active?: boolean;
};

// Define sections of navigation
type NavSection = {
  title: string;
  items: NavItem[];
};

export default function SellerNavbar() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch user data
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      }
    };
    getUser();
  }, []);

  // Define seller navigation sections and items
  const navSections: NavSection[] = [
    {
      title: "",
      items: [{ 
        icon: Home, 
        label: "Dashboard", 
        href: "/dashboard/seller"
      }],
    },
    {
      title: "SELLER TOOLS",
      items: [
        { icon: Tag, label: "My Listings", href: "/dashboard/seller/listings" },
        { icon: DollarSign, label: "Earnings", href: "/dashboard/seller/earnings" },
        { icon: CreditCard, label: "My Cubby", href: "/dashboard/seller/cubby" },
      ],
    }
  ];

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Check if a path is active
  const isPathActive = (href: string) => {
    if (href === "/dashboard/seller" && pathname === "/dashboard/seller") {
      return true;
    }
    return href !== "/dashboard/seller" && pathname?.startsWith(href);
  };

  // Navigation content component - shared between desktop and mobile
  const NavContent = () => {
    return (
      <>
        {/* Navigation sections */}
        <div className="flex-1 overflow-y-auto px-2 py-2 overscroll-contain">
          {navSections.map((section, index) => (
            <div key={index} className="mb-5">
              {section.title && <div className="mb-2 px-4 text-xs font-medium text-gray-500">{section.title}</div>}
              <nav className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "nav-item",
                      isPathActive(item.href) && "nav-item-active",
                      "touch-manipulation", // Improves touch response
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 relative z-10",
                        isPathActive(item.href) ? "text-pink-600" : "text-gray-500 group-hover:text-pink-500",
                      )}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom navigation items - Help and Settings */}
        <div className="border-t border-gray-200 px-2 py-2">
          <nav className="space-y-1">
            <Link
              href="/help"
              className={cn(
                "nav-item",
                pathname === "/help" && "nav-item-active",
                "touch-manipulation",
              )}
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle
                className={cn(
                  "h-4 w-4 relative z-10",
                  pathname === "/help" ? "text-pink-600" : "text-gray-500 group-hover:text-pink-500",
                )}
              />
              <span className="relative z-10">Help and Support</span>
            </Link>
            
            <Link
              href="/dashboard/seller/settings"
              className={cn(
                "nav-item",
                pathname === "/dashboard/seller/settings" && "nav-item-active",
                "touch-manipulation",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Settings
                className={cn(
                  "h-4 w-4 relative z-10",
                  pathname === "/dashboard/seller/settings" ? "text-pink-600" : "text-gray-500 group-hover:text-pink-500",
                )}
              />
              <span className="relative z-10">Settings</span>
            </Link>
            
            {/* Add theme switcher here */}
            <div className="nav-item">
              <ThemeSwitcher />
              <span className="relative z-10 ml-2">Theme</span>
            </div>
            
            {/* Sign out button */}
            <button
              onClick={handleSignOut}
              className="nav-item text-red-500 hover:text-red-600 hover:bg-red-50 w-full text-left"
            >
              <span className="relative z-10">Sign out</span>
            </button>
          </nav>
        </div>

        {/* Account section with actual user data */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 border border-gray-200">
              <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
              <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                {user?.email ? user.email.substring(0, 2).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.email?.split('@')[0] || "Seller"}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop navigation - fixed position with shadow */}
      <aside className="hidden md:flex fixed h-screen w-64 flex-col bg-white border-r border-gray-200 z-50 shadow-md">
        {/* Logo section */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100">
            <span className="text-lg font-bold text-pink-600">S</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">Seller Portal</span>
        </div>

        <NavContent />
      </aside>

      {/* Mobile navigation - fixed at top with shadow */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 items-center border-b border-gray-200 bg-white p-3 z-50 shadow-md">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 h-9 w-9">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] max-w-[300px] p-0 bg-white shadow-lg">
            {/* Logo section */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100">
                <span className="text-lg font-bold text-pink-600">S</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Seller Portal</span>
            </div>

            <NavContent />
          </SheetContent>
        </Sheet>

        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-pink-100">
          <span className="text-lg font-bold text-pink-600">S</span>
        </div>
        <span className="ml-2 text-xl font-semibold text-gray-900">Seller Portal</span>
        
        {/* Notification icon in mobile header */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-pink-600"></span>
          </Button>
        </div>
      </div>
    </>
  );
}
