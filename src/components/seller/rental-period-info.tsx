import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchOpenDaysConfiguration, calculateRentalEndDate } from "@/utils/rental-utils";
import { Calendar, InfoIcon } from "lucide-react";
import { format } from "date-fns";

interface RentalPeriodInfoProps {
  startDate: string;
  rentalDays: number | null;
  rentalPeriodName: string | null;
}

export default function RentalPeriodInfo({ 
  startDate, 
  rentalDays, 
  rentalPeriodName 
}: RentalPeriodInfoProps) {
  const [openDaysConfig, setOpenDaysConfig] = useState<{ [key: string]: boolean } | null>(null);
  const [closedDays, setClosedDays] = useState<string[]>([]);
  const [calendarDays, setCalendarDays] = useState<number | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch open days configuration on component mount
  useEffect(() => {
    const getOpenDaysConfig = async () => {
      try {
        const config = await fetchOpenDaysConfiguration();
        setOpenDaysConfig(config);
        
        // Determine which days are closed
        const closed = Object.entries(config)
          .filter(([_, isOpen]) => !isOpen)
          .map(([day]) => day);
        
        setClosedDays(closed);
      } catch (error) {
        console.error("Error fetching open days configuration:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getOpenDaysConfig();
  }, []);

  // Calculate end date and calendar days when rental days or start date changes
  useEffect(() => {
    const calculateDates = async () => {
      if (!rentalDays || !startDate || !openDaysConfig) return;
      
      try {
        // Parse start date string to Date object
        const startDateObj = new Date(startDate);
        
        // Calculate end date based on open days
        const calculatedEndDate = await calculateRentalEndDate(
          startDateObj,
          rentalDays,
          openDaysConfig
        );
        
        setEndDate(calculatedEndDate);
        
        // Calculate calendar days
        const diffTime = Math.abs(calculatedEndDate.getTime() - startDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the start day
        
        setCalendarDays(diffDays);
      } catch (error) {
        console.error("Error calculating rental dates:", error);
      }
    };
    
    calculateDates();
  }, [rentalDays, startDate, openDaysConfig]);

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return "--";
    return format(date, "dd/MM/yyyy");
  };

  // If still loading or missing data, show minimal UI
  if (loading || !rentalDays || !startDate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rental Period</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Please select a rental period...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-pink-600" />
          Rental Period
        </CardTitle>
        {rentalPeriodName && (
          <CardDescription>
            {rentalPeriodName.charAt(0).toUpperCase() + rentalPeriodName.slice(1)} rental ({rentalDays} open days)
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium">{format(new Date(startDate), "dd/MM/yyyy")}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium">{formatDate(endDate)}</p>
          </div>
        </div>
        
        {closedDays.length > 0 && calendarDays && calendarDays > rentalDays && (
          <div className="bg-pink-50 border border-pink-100 rounded-md p-3 text-sm">
            <div className="flex items-start">
              <InfoIcon className="w-4 h-4 mr-2 text-pink-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-pink-800 font-medium">Open Days Adjustment</p>
                <p className="text-pink-700 mt-1">
                  Since the shop is closed on{" "}
                  <span className="font-medium">
                    {closedDays
                      .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
                      .join(", ")}
                  </span>
                  , your rental will span {calendarDays} calendar days to ensure you get the full {rentalDays} open days.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 