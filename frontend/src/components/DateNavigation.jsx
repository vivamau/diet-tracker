import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "./ui/button";

const DateNavigation = ({ selectedDate, onDateChange }) => {
  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex items-center justify-center space-x-6">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousDay}
        className="h-12 w-12 rounded-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="text-center bg-white rounded-xl shadow-sm border px-8 py-4 min-w-[280px]">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {format(selectedDate, "EEEE, MMMM d")}
        </div>
        <div className="text-sm text-blue-600 font-medium">
          {format(selectedDate, "yyyy")}
        </div>
        {isToday && (
          <div className="text-xs text-green-600 font-medium mt-1 bg-green-50 px-2 py-1 rounded-full inline-block">
            Today
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextDay}
        className="h-12 w-12 rounded-full border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {!isToday && (
        <Button
          variant="outline"
          onClick={handleToday}
          className="ml-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Today
        </Button>
      )}
    </div>
  );
};

export default DateNavigation;
