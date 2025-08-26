import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, Zap, Beef, Wheat, Droplet } from "lucide-react";

const NutritionSummary = ({ date, refreshTrigger }) => {
  const [nutritionData, setNutritionData] = useState({
    calories: 0,
    proteins: 0,
    carbohydrates: 0,
    fat: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateDailyNutrition = async () => {
      setLoading(true);
      try {
        // Fetch meals for the date
        const mealsResponse = await fetch(
          `http://localhost:3001/api/meals/${date}`
        );
        const meals = await mealsResponse.json();

        let totalCalories = 0;
        let totalProteins = 0;
        let totalCarbohydrates = 0;
        let totalFat = 0;

        // Calculate nutrition for each meal type
        for (const mealType of ["breakfast", "lunch", "dinner", "snacks"]) {
          const mealItems = meals[mealType] || [];

          for (const item of mealItems) {
            try {
              const foodResponse = await fetch(
                `http://localhost:3001/api/food-items/${item.foodItemId}`
              );
              if (foodResponse.ok) {
                const food = await foodResponse.json();
                const multiplier = item.quantity / 100; // Convert to per gram basis

                totalCalories += food.calories * multiplier;
                totalProteins += food.proteins * multiplier;
                totalCarbohydrates += food.carbohydrates * multiplier;
                totalFat += food.fat * multiplier;
              }
            } catch (error) {
              console.error(
                `Error fetching food item ${item.foodItemId}:`,
                error
              );
            }
          }
        }

        setNutritionData({
          calories: Math.round(totalCalories),
          proteins: Math.round(totalProteins * 10) / 10,
          carbohydrates: Math.round(totalCarbohydrates * 10) / 10,
          fat: Math.round(totalFat * 10) / 10,
        });
      } catch (error) {
        console.error("Error calculating daily nutrition:", error);
      } finally {
        setLoading(false);
      }
    };

    calculateDailyNutrition();
  }, [date, refreshTrigger]);

  if (loading) {
    return (
      <Card className="shadow-sm bg-gradient-to-r from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <span>Daily Nutrition Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Daily targets (these could be made configurable)
  const targets = {
    calories: 2000,
    proteins: 150,
    carbohydrates: 250,
    fat: 65,
  };

  const NutritionCard = ({
    title,
    current,
    target,
    unit,
    color,
    icon: Icon,
  }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOverTarget = current > target;

    return (
      <div className="relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <div
            className={`text-xs px-2 py-1 rounded-full ${
              isOverTarget
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {Math.round(percentage)}%
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className={`text-2xl font-bold ${color}`}>
              {current}
              {unit}
            </span>
            <span className="text-sm text-gray-500">
              / {target}
              {unit}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                isOverTarget
                  ? "bg-red-500"
                  : color.replace("text-", "bg-").replace("-600", "-500")
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="text-xs text-gray-500">
            {current > 0
              ? `${
                  target - current > 0 ? Math.round(target - current) : 0
                }${unit} remaining`
              : `Target: ${target}${unit}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-sm bg-gradient-to-r from-white to-gray-50">
      <CardHeader className="pb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <CardTitle className="text-xl">Daily Nutrition Summary</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NutritionCard
            title="Calories"
            current={nutritionData.calories}
            target={targets.calories}
            unit=""
            color="text-blue-600"
            icon={Zap}
          />

          <NutritionCard
            title="Protein"
            current={nutritionData.proteins}
            target={targets.proteins}
            unit="g"
            color="text-red-600"
            icon={Beef}
          />

          <NutritionCard
            title="Carbs"
            current={nutritionData.carbohydrates}
            target={targets.carbohydrates}
            unit="g"
            color="text-green-600"
            icon={Wheat}
          />

          <NutritionCard
            title="Fat"
            current={nutritionData.fat}
            target={targets.fat}
            unit="g"
            color="text-yellow-600"
            icon={Droplet}
          />
        </div>

        {nutritionData.calories === 0 && (
          <div className="text-center text-gray-500 mt-8 p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-medium mb-1">
              Ready to start tracking?
            </div>
            <div className="text-sm">
              Add food items to see your daily nutrition breakdown
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NutritionSummary;
