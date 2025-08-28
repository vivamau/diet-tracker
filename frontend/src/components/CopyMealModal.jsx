import { useState, useEffect } from "react";
import { Copy, Calendar, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiGet } from "../lib/api";

const CopyMealModal = ({
  isOpen,
  onClose,
  onCopyMeal,
  currentDate,
  currentMealType,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("breakfast");
  const [availableMeals, setAvailableMeals] = useState({});
  const [selectedMealItems, setSelectedMealItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [foodItemsCache, setFoodItemsCache] = useState({});

  const mealTypes = [
    { key: "breakfast", label: "🌅 Breakfast", icon: "🍳" },
    { key: "lunch", label: "☀️ Lunch", icon: "🥗" },
    { key: "dinner", label: "🌙 Dinner", icon: "🍽️" },
    { key: "snacks", label: "🍿 Snacks", icon: "🥨" },
  ];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDate("");
      setSelectedMealType("breakfast");
      setAvailableMeals({});
      setSelectedMealItems([]);
      setFoodItemsCache({});
    }
  }, [isOpen]);

  // Fetch meals when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchMealsForDate(selectedDate);
    }
  }, [selectedDate]);

  // Update selected meal items when meal type changes
  useEffect(() => {
    if (availableMeals[selectedMealType]) {
      setSelectedMealItems(availableMeals[selectedMealType]);
    } else {
      setSelectedMealItems([]);
    }
  }, [selectedMealType, availableMeals]);

  const fetchMealsForDate = async (date) => {
    try {
      setLoading(true);
      const response = await apiGet(
        import.meta.env.VITE_URL_BE + `/api/meals/${date}`
      );
      if (response.ok) {
        const meals = await response.json();
        setAvailableMeals(meals);

        // Fetch food item details for all meals
        const foodItemIds = new Set();
        Object.values(meals).forEach((mealItems) => {
          mealItems.forEach((item) => foodItemIds.add(item.foodItemId));
        });

        await fetchFoodItemDetails(Array.from(foodItemIds));
      }
    } catch (error) {
      console.error("Error fetching meals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoodItemDetails = async (foodItemIds) => {
    const newCache = { ...foodItemsCache };

    for (const id of foodItemIds) {
      if (!newCache[id]) {
        try {
          const response = await apiGet(
            import.meta.env.VITE_URL_BE + `/api/food-items/${id}`
          );
          if (response.ok) {
            const foodItem = await response.json();
            newCache[id] = foodItem;
          }
        } catch (error) {
          console.error(`Error fetching food item ${id}:`, error);
        }
      }
    }

    setFoodItemsCache(newCache);
  };

  const handleCopyMeal = async () => {
    if (selectedMealItems.length === 0) {
      alert("No food items to copy from the selected meal.");
      return;
    }

    try {
      // Copy each food item from the selected meal to the current meal
      for (const item of selectedMealItems) {
        await onCopyMeal(item.foodItemId, item.quantity);
      }
      onClose();
    } catch (error) {
      console.error("Error copying meal:", error);
      alert("Failed to copy meal. Please try again.");
    }
  };

  const calculateMealNutrition = (mealItems) => {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    mealItems.forEach((item) => {
      const foodDetails = foodItemsCache[item.foodItemId];
      if (foodDetails) {
        const multiplier = item.quantity / 100;
        totalCalories += foodDetails.calories * multiplier;
        totalProtein += foodDetails.proteins * multiplier;
        totalCarbs += foodDetails.carbohydrates * multiplier;
        totalFat += foodDetails.fat * multiplier;
      }
    });

    return {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
    };
  };

  const getCurrentMealLabel = () => {
    const meal = mealTypes.find((m) => m.key === currentMealType);
    return meal ? meal.label : currentMealType;
  };

  const nutrition =
    selectedMealItems.length > 0
      ? calculateMealNutrition(selectedMealItems)
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Copy Meal to {getCurrentMealLabel()}</span>
          </DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Select Date to Copy From</span>
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={currentDate}
              className="w-full"
            />
          </div>

          {/* Meal Type Selection */}
          {selectedDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Select Meal Type</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {mealTypes.map((meal) => (
                  <Button
                    key={meal.key}
                    variant={
                      selectedMealType === meal.key ? "default" : "outline"
                    }
                    onClick={() => setSelectedMealType(meal.key)}
                    className="justify-start"
                  >
                    <span className="mr-2">{meal.icon}</span>
                    {meal.label.replace(/^[^\w\s]+\s*/, "").trim()}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          )}

          {/* Meal Items Display */}
          {selectedDate && !loading && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="border rounded-md flex-1 overflow-y-auto">
                {selectedMealItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No food items found for this meal
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    {selectedMealItems.map((item) => {
                      const foodDetails = foodItemsCache[item.foodItemId];
                      if (!foodDetails) {
                        return (
                          <div key={item.id} className="p-3 bg-muted rounded">
                            Loading food details...
                          </div>
                        );
                      }

                      const totalCalories = Math.round(
                        (foodDetails.calories * item.quantity) / 100
                      );
                      const totalProtein = Math.round(
                        (foodDetails.proteins * item.quantity) / 100
                      );
                      const totalCarbs = Math.round(
                        (foodDetails.carbohydrates * item.quantity) / 100
                      );
                      const totalFat = Math.round(
                        (foodDetails.fat * item.quantity) / 100
                      );

                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="font-medium text-gray-900 mb-1">
                            {foodDetails.name}
                          </div>
                          <div className="flex items-center space-x-3 text-sm">
                            <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
                              {item.quantity}g
                            </span>
                            <span className="text-blue-600 font-medium">
                              {totalCalories} cal
                            </span>
                            <div className="flex space-x-2 text-xs text-gray-600">
                              <span>P: {totalProtein}g</span>
                              <span>C: {totalCarbs}g</span>
                              <span>F: {totalFat}g</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Nutrition Summary */}
              {nutrition && selectedMealItems.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm font-medium mb-2">
                    Total Nutrition
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center p-2 rounded-lg bg-blue-50">
                      <div className="font-bold text-blue-700">
                        {nutrition.calories}
                      </div>
                      <div className="text-xs text-blue-600">Calories</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50">
                      <div className="font-bold text-red-700">
                        {nutrition.protein}g
                      </div>
                      <div className="text-xs text-red-600">Protein</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-green-50">
                      <div className="font-bold text-green-700">
                        {nutrition.carbs}g
                      </div>
                      <div className="text-xs text-green-600">Carbs</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-yellow-50">
                      <div className="font-bold text-yellow-700">
                        {nutrition.fat}g
                      </div>
                      <div className="text-xs text-yellow-600">Fat</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCopyMeal}
              disabled={selectedMealItems.length === 0 || loading}
              className="flex items-center space-x-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy {selectedMealItems.length} Items</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyMealModal;
