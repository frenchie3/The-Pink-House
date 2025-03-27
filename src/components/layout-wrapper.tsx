/**
 * Layout Wrapper Component
 *
 * This component provides a consistent layout structure across dashboard pages with:
 * - A fixed header that stays at the top
 * - A main content area that fills remaining space and handles all scrolling
 * - Single scrollable container for the entire page
 *
 * Usage:
 * <LayoutWrapper>
 *   <YourNavbar />
 *   <YourMainContent />
 * </LayoutWrapper>
 */

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return <div className="flex flex-col h-screen overflow-hidden relative">{children}</div>;
}

/**
 * Main Content Wrapper
 *
 * This component wraps the main content area of the dashboard pages.
 * It ensures the content area fills the remaining space and handles scrolling.
 */

interface MainContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ children, className = "" }: MainContentProps) {
  return (
    <main className={`flex-1 overflow-auto ${className}`}>
      {children}
    </main>
  );
}
