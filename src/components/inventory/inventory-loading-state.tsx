import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingDots } from "@/components/ui/loading-dots";

export function InventoryLoadingState() {
  return (
    <div className="flex flex-col justify-center items-center py-12 space-y-4">
      <div className="relative">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-pink-100 rounded-xl blur-sm opacity-30 animate-pulse"></div>
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-700 font-medium">Loading inventory items</p>
        <p className="text-gray-500 text-sm">Fetching your latest data...</p>
      </div>
    </div>
  );
}
