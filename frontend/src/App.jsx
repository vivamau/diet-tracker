import { useState } from "react";
import { format } from "date-fns";
import DateNavigation from "./components/DateNavigation";
import MealCard from "./components/MealCard";
import NutritionSummary from "./components/NutritionSummary";

function App() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleMealUpdate = () => {
    // Trigger refresh of nutrition summary when meals are updated
    console.log(
      "App: handleMealUpdate called, current refreshTrigger:",
      refreshTrigger
    );
    setRefreshTrigger((prev) => {
      const newValue = prev + 1;
      console.log("App: Setting refreshTrigger to:", newValue);
      return newValue;
    });
  };

  const formattedDate = format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Diet Management
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Track your nutrition and achieve your health goals
            </p>
          </div>
          <DateNavigation
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
          />
        </header>

        <main className="space-y-8">
          <NutritionSummary
            date={formattedDate}
            refreshTrigger={refreshTrigger}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MealCard
              mealType="breakfast"
              title="Breakfast"
              date={formattedDate}
              onMealUpdate={handleMealUpdate}
            />
            <MealCard
              mealType="lunch"
              title="Lunch"
              date={formattedDate}
              onMealUpdate={handleMealUpdate}
            />
            <MealCard
              mealType="dinner"
              title="Dinner"
              date={formattedDate}
              onMealUpdate={handleMealUpdate}
            />
            <MealCard
              mealType="snacks"
              title="Snacks"
              date={formattedDate}
              onMealUpdate={handleMealUpdate}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
