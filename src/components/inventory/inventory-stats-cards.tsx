import { BoxIcon, AlertTriangle, ShoppingBag } from "lucide-react";

interface InventoryStatsCardsProps {
  totalItems: number;
  lowStockItems: number;
  recentSales: number;
}

export default function InventoryStatsCards({
  totalItems = 0,
  lowStockItems = 0,
  recentSales = 0,
}: InventoryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Items Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Total Items</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{totalItems}</p>
          <p className="text-xs text-gray-500 mt-1">Items in inventory</p>
        </div>
        <div className="bg-pink-100 p-3 rounded-lg">
          <BoxIcon className="h-6 w-6 text-pink-600" />
        </div>
      </div>

      {/* Low Stock Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Low Stock</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">
            {lowStockItems}
          </p>
          <p className="text-xs text-gray-500 mt-1">Items need restocking</p>
        </div>
        <div className="bg-cyan-100 p-3 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-cyan-600" />
        </div>
      </div>

      {/* Recent Sales Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Recent Sales</p>
          <p className="text-3xl font-bold mt-1 text-gray-900">{recentSales}</p>
          <p className="text-xs text-gray-500 mt-1">In the last 7 days</p>
        </div>
        <div className="bg-pink-100 p-3 rounded-lg">
          <ShoppingBag className="h-6 w-6 text-pink-600" />
        </div>
      </div>
    </div>
  );
}
