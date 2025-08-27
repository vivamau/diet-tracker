import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import AddFoodModal from "./AddFoodModal";
import { apiGet, apiPost, apiDelete } from "../lib/api";

const MealCard = ({ mealType, title, date, onMealUpdate }) => {
  const [mealItems, setMealItems] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mealNutrition, setMealNutrition] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Fetch meal items for this date and meal type
  const fetchMealItems = async () => {
    try {
      setLoading(true);
      const response = await apiGet(
        import.meta.env.VITE_URL_BE + `/api/meals/${date}`
      );
      const data = await response.json();
      setMealItems(data[mealType] || []);
    } catch (error) {
      console.error("Error fetching meal items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate meal nutrition whenever meal items change
  useEffect(() => {
    const calculateNutrition = async () => {
      if (!mealItems || mealItems.length === 0) {
        setMealNutrition({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
        return;
      }

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      // Fetch nutrition for each meal item
      for (const item of mealItems) {
        try {
          const response = await apiGet(
            import.meta.env.VITE_URL_BE + `/api/food-items/${item.foodItemId}`
          );
          if (response.ok) {
            const foodDetails = await response.json();
            const multiplier = item.quantity / 100;

            totalCalories += foodDetails.calories * multiplier;
            totalProtein += foodDetails.proteins * multiplier;
            totalCarbs += foodDetails.carbohydrates * multiplier;
            totalFat += foodDetails.fat * multiplier;
          }
        } catch (error) {
          console.error("Error fetching food details:", error);
        }
      }

      setMealNutrition({
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein * 10) / 10,
        carbs: Math.round(totalCarbs * 10) / 10,
        fat: Math.round(totalFat * 10) / 10,
      });
    };

    calculateNutrition();
  }, [mealItems]);

  useEffect(() => {
    fetchMealItems();
  }, [date, mealType]);

  const handleAddFood = async (foodItemId, quantity) => {
    try {
      const response = await apiPost(
        import.meta.env.VITE_URL_BE + `/api/meals/${date}/${mealType}`,
        { foodItemId, quantity }
      );

      if (response.ok) {
        await fetchMealItems(); // Refresh the meal items
        setIsAddModalOpen(false);
        if (onMealUpdate) {
          onMealUpdate(); // Notify parent to refresh nutrition summary
        }
      } else {
        console.error("Failed to add food item:", response.status);
      }
    } catch (error) {
      console.error("Error adding food item:", error);
      alert("Failed to add food item. Please try again.");
    }
  };

  const handleRemoveFood = async (mealEntryId) => {
    try {
      const response = await apiDelete(
        import.meta.env.VITE_URL_BE +
          `/api/meals/${date}/${mealType}/${mealEntryId}`
      );

      if (response.ok) {
        await fetchMealItems(); // Refresh the meal items
        if (onMealUpdate) {
          onMealUpdate(); // Notify parent to refresh nutrition summary
        }
      } else {
        console.error("Failed to remove food item:", response.status);
      }
    } catch (error) {
      console.error("Error removing food item:", error);
      alert("Failed to remove food item. Please try again.");
    }
  };

  // Use the calculated meal nutrition
  const nutrition = mealNutrition;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold flex items-center space-x-2">
          <span className="text-2xl">{title.split(" ")[0]}</span>
          <span>{title.split(" ").slice(1).join(" ")}</span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Food
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : (
          <>
            {mealItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground font-medium">
                  No food items added yet
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Click "Add Food" to get started
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {mealItems.map((item) => (
                  <MealItem
                    key={item.id}
                    item={item}
                    onRemove={() => handleRemoveFood(item.id)}
                  />
                ))}
              </div>
            )}

            {mealItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
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
          </>
        )}
      </CardContent>

      <AddFoodModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddFood={handleAddFood}
      />
    </Card>
  );
};

const MealItem = ({ item, onRemove }) => {
  const [foodDetails, setFoodDetails] = useState(null);

  useEffect(() => {
    const fetchFoodDetails = async () => {
      try {
        const response = await apiGet(
          import.meta.env.VITE_URL_BE + `/api/food-items/${item.foodItemId}`
        );
        if (response.ok) {
          const data = await response.json();
          setFoodDetails(data);
        }
      } catch (error) {
        console.error("Error fetching food details:", error);
      }
    };

    fetchFoodDetails();
  }, [item.foodItemId]);

  if (!foodDetails) {
    return (
      <div className="flex items-center justify-between p-2 bg-muted rounded">
        <span>Loading...</span>
      </div>
    );
  }

  const totalCalories = Math.round(
    (foodDetails.calories * item.quantity) / 100
  );
  const totalProtein = Math.round((foodDetails.proteins * item.quantity) / 100);
  const totalCarbs = Math.round(
    (foodDetails.carbohydrates * item.quantity) / 100
  );
  const totalFat = Math.round((foodDetails.fat * item.quantity) / 100);

  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 group">
      <div className="flex-1">
        <div className="font-semibold text-gray-900 mb-1">
          {foodDetails.name}
        </div>
        <div className="flex items-center space-x-3 text-sm">
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-medium">
            {item.quantity}g
          </span>
          <span className="text-blue-600 font-medium">{totalCalories} cal</span>
          <div className="flex space-x-2 text-xs text-gray-600">
            <span>P: {totalProtein}g</span>
            <span>C: {totalCarbs}g</span>
            <span>F: {totalFat}g</span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MealCard;
