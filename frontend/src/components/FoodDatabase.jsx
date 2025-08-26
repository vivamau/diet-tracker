import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, ArrowLeft, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import AddNewFoodModal from "./AddNewFoodModal";
import { apiGet, apiDelete } from "../lib/api";

const FoodDatabase = ({ onBack }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch all food items
  const fetchFoodItems = async () => {
    try {
      setLoading(true);
      const response = await apiGet("http://localhost:3001/api/food-items");
      const data = await response.json();
      setFoodItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Filter items based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(foodItems);
    } else {
      setFilteredItems(
        foodItems.filter(
          (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.barcode && item.barcode.includes(searchQuery))
        )
      );
    }
  }, [searchQuery, foodItems]);

  const handleDeleteFood = async (foodId, foodName) => {
    if (
      !confirm(
        `Are you sure you want to delete "${foodName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await apiDelete(
        `http://localhost:3001/api/food-items/${foodId}`
      );
      if (response.ok) {
        await fetchFoodItems(); // Refresh the list
      } else {
        alert("Failed to delete food item");
      }
    } catch (error) {
      console.error("Error deleting food item:", error);
      alert("Failed to delete food item");
    }
  };

  const handleFoodAdded = () => {
    fetchFoodItems();
    setIsAddModalOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Diet Tracker</span>
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add New Food</span>
            </Button>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Food Database
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Manage your personal food collection
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </header>

        <main>
          {/* Stats Card */}
          <Card className="mb-6 bg-gradient-to-r from-white to-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {foodItems.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Foods</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {foodItems.filter((item) => item.barcode).length}
                  </div>
                  <div className="text-sm text-gray-600">With Barcodes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredItems.length}
                  </div>
                  <div className="text-sm text-gray-600">Showing</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Items Grid */}
          {filteredItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {foodItems.length === 0
                    ? "No food items yet"
                    : "No matching foods found"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {foodItems.length === 0
                    ? "Start building your food database by adding new items"
                    : "Try adjusting your search terms"}
                </p>
                {foodItems.length === 0 && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Food
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <FoodItemCard
                  key={item.id}
                  item={item}
                  onDelete={() => handleDeleteFood(item.id, item.name)}
                />
              ))}
            </div>
          )}
        </main>

        <AddNewFoodModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onFoodAdded={handleFoodAdded}
        />
      </div>
    </div>
  );
};

const FoodItemCard = ({ item, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
              {item.name}
            </CardTitle>
            {item.barcode && (
              <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md inline-block font-mono">
                {item.barcode}
              </div>
            )}
          </div>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Calories - Main highlight */}
          <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {item.calories}
            </div>
            <div className="text-sm text-blue-600">calories per 100g</div>
          </div>

          {/* Macronutrients Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-red-50 rounded-lg">
              <div className="font-bold text-red-700">{item.proteins}g</div>
              <div className="text-xs text-red-600">Protein</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <div className="font-bold text-green-700">
                {item.carbohydrates}g
              </div>
              <div className="text-xs text-green-600">Carbs</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded-lg">
              <div className="font-bold text-yellow-700">{item.fat}g</div>
              <div className="text-xs text-yellow-600">Fat</div>
            </div>
          </div>

          {/* Created date */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Added {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodDatabase;
