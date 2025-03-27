"use client";

import React from "react";
import SellerNavbar from "./seller-navbar";
import { LayoutWrapper, MainContent } from "./layout-wrapper";

interface SellerLayoutProps {
  children: React.ReactNode;
}

/**
 * SellerLayout Component
 *
 * This component provides a consistent layout for all seller pages by:
 * - Including the vertical navigation sidebar
 * - Handling proper content spacing with the sidebar
 * - Working on both mobile and desktop views
 *
 * Usage:
 * <SellerLayout>
 *   <YourPageContent />
 * </SellerLayout>
 */
export default function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <LayoutWrapper>
      <SellerNavbar />
      {/* Add proper padding to account for the fixed sidebar on desktop */}
      <MainContent className="md:pl-64 pt-16 md:pt-6 bg-gray-50 min-h-screen w-full">
        <div className="container mx-auto px-4 py-4">
          {children}
        </div>
      </MainContent>
    </LayoutWrapper>
  );
} 