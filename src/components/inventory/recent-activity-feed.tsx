import { ShoppingBag, Package, Tag, Clock } from "lucide-react";
import { memo } from "react";

// Memoized to prevent re-renders when parent components update
const RecentActivityFeed = memo(function RecentActivityFeed() {
  // This would normally be fetched from the database
  const activities = [
    {
      id: 1,
      type: "sale",
      description: "Sale completed: 3 items for $45.99",
      time: "10 minutes ago",
      icon: <ShoppingBag className="h-5 w-5" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 2,
      type: "donation",
      description: "New donation received: Clothing bundle",
      time: "1 hour ago",
      icon: <Package className="h-5 w-5" />,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      id: 3,
      type: "inventory",
      description: "Item SKU-1234 updated: Price changed to $12.99",
      time: "2 hours ago",
      icon: <Tag className="h-5 w-5" />,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      id: 4,
      type: "sale",
      description: "Sale completed: 1 item for $19.99",
      time: "3 hours ago",
      icon: <ShoppingBag className="h-5 w-5" />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 5,
      type: "inventory",
      description: "Low stock alert: 'Vintage Teacups' (2 remaining)",
      time: "5 hours ago",
      icon: <Tag className="h-5 w-5" />,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  return (
    <div className="space-y-4">
      {activities.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No recent activity to display</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li
              key={activity.id}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50"
            >
              <div
                className={`${activity.iconBg} p-2 rounded-lg ${activity.iconColor} flex-shrink-0`}
              >
                {activity.icon}
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm text-gray-900 font-medium">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="pt-2">
        <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
});

export default RecentActivityFeed;
