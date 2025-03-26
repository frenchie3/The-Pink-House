"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  isSameDay,
  isWithinInterval,
} from "date-fns";

// Color palette for rentals (using softer, more pastel colors)
const RENTAL_COLORS = [
  {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
];

// Types for our component
interface CubbyRental {
  id: string;
  cubby_id: string;
  seller_id: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "pending_extension" | "cancelled";
  payment_status: "paid" | "pending" | "overdue";
  seller: {
    full_name: string;
  };
  cubby: {
    cubby_number: string;
    location: string;
  };
}

interface Cubby {
  id: string;
  cubby_number: string;
  location: string;
  status: string;
}

interface CubbyCalendarViewProps {
  cubbies: Cubby[];
  rentals: CubbyRental[];
  initialDate?: Date;
}

interface RentalWithColor extends CubbyRental {
  colorIndex?: number;
}

export default function CubbyCalendarView({
  cubbies,
  rentals: initialRentals,
  initialDate = new Date(),
}: CubbyCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<"week" | "2weeks">("week");

  // Calculate dates for the calendar
  const dates = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    const numberOfDays = view === "week" ? 7 : 14;
    return Array.from({ length: numberOfDays }, (_, i) => addDays(start, i));
  }, [currentDate, view]);

  // Assign colors to rentals based on concurrent usage
  const rentals = useMemo(() => {
    const rentalsWithColor = [...initialRentals] as RentalWithColor[];

    // Sort rentals by start date
    rentalsWithColor.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    );

    rentalsWithColor.forEach((rental) => {
      const rentalStart = new Date(rental.start_date);
      const rentalEnd = new Date(rental.end_date);

      // Find concurrent rentals
      const concurrentRentals = rentalsWithColor.filter((r) => {
        if (r === rental) return false;
        const rStart = new Date(r.start_date);
        const rEnd = new Date(r.end_date);

        return (
          isWithinInterval(rStart, { start: rentalStart, end: rentalEnd }) ||
          isWithinInterval(rEnd, { start: rentalStart, end: rentalEnd }) ||
          isWithinInterval(rentalStart, { start: rStart, end: rEnd })
        );
      });

      // Find first available color not used by concurrent rentals
      const usedColors = new Set(concurrentRentals.map((r) => r.colorIndex));
      const availableColor = RENTAL_COLORS.findIndex(
        (_, index) => !usedColors.has(index),
      );
      rental.colorIndex = availableColor >= 0 ? availableColor : 0;
    });

    return rentalsWithColor;
  }, [initialRentals]);

  // Navigate between weeks
  const navigateWeeks = (direction: "prev" | "next") => {
    const weeks = view === "week" ? 1 : 2;
    setCurrentDate((prev) =>
      direction === "next" ? addWeeks(prev, weeks) : addWeeks(prev, -weeks),
    );
  };

  // Get rental status for a specific cubby and date
  const getRentalForCubbyAndDate = (cubbyId: string, date: Date) => {
    return rentals.find((rental) => {
      const startDate = new Date(rental.start_date);
      const endDate = new Date(rental.end_date);
      return (
        rental.cubby_id === cubbyId && date >= startDate && date <= endDate
      );
    });
  };

  return (
    <Card className="p-4 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeeks("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <span className="font-medium">
            {format(dates[0], "MMM d")} -{" "}
            {format(dates[dates.length - 1], "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeeks("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            variant={view === "2weeks" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("2weeks")}
          >
            2 Weeks
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Date Headers */}
          <div className="grid grid-cols-[150px_1fr] gap-2">
            <div className="font-medium text-gray-500">Cubbies</div>
            <div className="grid grid-cols-7 gap-0 border-l border-t border-gray-200">
              {dates.map((date, i) => (
                <div
                  key={i}
                  className={`text-center p-2 font-medium border-b-2 ${
                    isSameDay(date, new Date())
                      ? "bg-pink-50 rounded-t-md border-pink-200"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-lg">{format(date, "d")}</div>
                  <div className="text-xs font-bold text-gray-500 uppercase">
                    {format(date, "EEE")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cubby Rows */}
          <div className="mt-4 space-y-2">
            {cubbies.map((cubby) => (
              <div key={cubby.id} className="grid grid-cols-[150px_1fr] gap-2">
                <div className="font-medium flex items-center">
                  <span className="truncate">
                    #{cubby.cubby_number} - {cubby.location}
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-0 relative h-16">
                  {/* Empty grid cells for structure */}
                  {dates.map((date, i) => (
                    <div
                      key={i}
                      className="h-16 border border-gray-200 bg-white hover:bg-gray-50/50 transition-colors"
                    />
                  ))}

                  {/* Overlay rentals as floating elements */}
                  {rentals
                    .filter((rental) => {
                      const rentalStart = new Date(rental.start_date);
                      const rentalEnd = new Date(rental.end_date);
                      // Check if rental overlaps with current date range
                      return dates.some((date) => {
                        return (
                          date >= rentalStart &&
                          date <= rentalEnd &&
                          rental.cubby_id === cubby.id
                        );
                      });
                    })
                    .map((rental, idx) => {
                      const rentalStart = new Date(rental.start_date);
                      const rentalEnd = new Date(rental.end_date);
                      const colors =
                        RENTAL_COLORS[
                          (rental as RentalWithColor).colorIndex || 0
                        ];

                      // Find the position in the grid
                      const startIdx = dates.findIndex(
                        (date) => date >= rentalStart,
                      );
                      const endIdx = dates.findIndex(
                        (date) => date > rentalEnd,
                      );
                      const actualEndIdx =
                        endIdx === -1 ? dates.length - 1 : endIdx - 1;

                      // Calculate width based on days
                      const spanDays = actualEndIdx - startIdx + 1;
                      const leftPosition = `${(startIdx / dates.length) * 100}%`;
                      const width = `${(spanDays / dates.length) * 100}%`;

                      return (
                        <Link
                          key={`rental-${rental.id}-${idx}`}
                          href={`/dashboard/staff/cubby-management/${rental.id}`}
                          className={`absolute top-1/2 -translate-y-1/2 rounded-md shadow-sm px-2 py-1 z-10 ${colors?.bg} ${colors?.border} ${colors?.text} border cursor-pointer hover:brightness-95 transition-all`}
                          style={{
                            left: `calc(${leftPosition} + 4px)`,
                            width: `calc(${width} - 8px)`,
                            height: "2.5rem",
                            display: "flex",
                            alignItems: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rental.seller.full_name}
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
