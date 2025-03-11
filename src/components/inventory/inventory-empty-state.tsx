import { Button } from "@/components/ui/button";

export function InventoryEmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">No inventory items found</p>
      <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
        Add Your First Item
      </Button>
    </div>
  );
}
