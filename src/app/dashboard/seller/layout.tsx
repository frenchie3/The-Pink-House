import SellerLayout from "@/components/seller-layout";

/**
 * Seller Dashboard Layout
 * 
 * This layout wraps all seller dashboard pages with the new vertical navigation sidebar.
 * It ensures consistent layout and navigation across all seller pages.
 */
export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerLayout>{children}</SellerLayout>;
} 