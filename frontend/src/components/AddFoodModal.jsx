import { useState, useEffect } from "react";
import { Search, Plus, Scan, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import AddNewFoodModal from "./AddNewFoodModal";
import BarcodeScanner from "./BarcodeScanner";

const AddFoodModal = ({ isOpen, onClose, onAddFood }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [isAddNewFoodOpen, setIsAddNewFoodOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [showManualBarcodeInput, setShowManualBarcodeInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  const [foundFromLocalDB, setFoundFromLocalDB] = useState(false); // Backend URL

  // Fetch all food items
  const fetchFoodItems = async () => {
    try {
      const response = await fetch(
        import.meta.env.VITE_URL_BE + "/api/food-items"
      );
      const data = await response.json();
      setFoodItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching food items:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFoodItems();
      setSearchQuery("");
      setSelectedFood(null);
      setQuantity(100);
      setFoundFromLocalDB(false);
      setIsSearchingAPI(false);
      setScannerError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(foodItems);
    } else {
      setFilteredItems(
        foodItems.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, foodItems]);

  const handleAddFood = () => {
    if (selectedFood && quantity > 0) {
      onAddFood(selectedFood.id, quantity);
    }
  };

  const handleNewFoodAdded = () => {
    fetchFoodItems(); // Refresh the food items list
    setIsAddNewFoodOpen(false);
  };

  const fetchFromOpenFoodFacts = async (barcode) => {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=product_name,nutriments`
      );
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};

        // Convert OpenFoodFacts data to our format (per 100g)
        return {
          name: product.product_name || `Product ${barcode}`,
          calories:
            nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0,
          proteins: nutriments["proteins_100g"] || nutriments.proteins || 0,
          carbohydrates:
            nutriments["carbohydrates_100g"] || nutriments.carbohydrates || 0,
          fat: nutriments["fat_100g"] || nutriments.fat || 0,
          barcode: barcode,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching from OpenFoodFacts:", error);
      return null;
    }
  };

  const handleBarcodeScanned = async (barcode) => {
    setIsScannerOpen(false);
    setScannerError(null);
    setFoundFromLocalDB(false);
    setIsSearchingAPI(false);

    try {
      // First, search for food item in our local database
      const localResponse = await fetch(
        import.meta.env.VITE_URL_BE + `/api/food-items/barcode/${barcode}`
      );

      if (localResponse.ok) {
        const foodItem = await localResponse.json();
        setSelectedFood(foodItem);
        setSearchQuery(foodItem.name);
        setFoundFromLocalDB(true); // Mark as found locally for blue background

        // Show brief success message for local finds
        setScannerError("✅ Found in your local database!");
        setTimeout(() => setScannerError(null), 2000);
        return;
      }

      // If not found locally, try OpenFoodFacts API
      if (localResponse.status === 404) {
        setIsSearchingAPI(true);
        setScannerError("🔍 Searching OpenFoodFacts database...");

        const openFoodFactsData = await fetchFromOpenFoodFacts(barcode);

        if (openFoodFactsData) {
          // Automatically create the food item in our database
          const createResponse = await fetch(
            import.meta.env.VITE_URL_BE + "/api/food-items",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(openFoodFactsData),
            }
          );

          if (createResponse.ok) {
            const newFoodItem = await createResponse.json();
            await fetchFoodItems(); // Refresh the food items list
            setSelectedFood(newFoodItem);
            setSearchQuery(newFoodItem.name);
            setFoundFromLocalDB(false); // New items don't get blue background
            setScannerError("✅ Product found and added to your database!");
            setTimeout(() => setScannerError(null), 3000);
          } else {
            setScannerError(
              "Food found but failed to save. Please try adding manually."
            );
          }
        } else {
          setScannerError(
            `No nutrition data found for barcode ${barcode}. Would you like to add it manually?`
          );
        }
      } else {
        setScannerError("Error searching for barcode. Please try again.");
      }
    } catch (error) {
      console.error("Error searching by barcode:", error);
      setScannerError("Error searching for barcode. Please try again.");
    } finally {
      setIsSearchingAPI(false);
    }
  };

  const handleScannerError = (error) => {
    console.error("Barcode scanner error:", error);
    setScannerError(
      "Unable to access camera. You can try manual barcode entry instead."
    );
  };

  const closeScannerError = () => {
    setScannerError(null);
    setIsSearchingAPI(false);
    setFoundFromLocalDB(false);
  };

  const handleManualBarcodeSubmit = async () => {
    if (!manualBarcode.trim()) {
      alert("Please enter a barcode");
      return;
    }

    setShowManualBarcodeInput(false);
    await handleBarcodeScanned(manualBarcode.trim());
    setManualBarcode("");
  };

  const openManualBarcodeInput = () => {
    setShowManualBarcodeInput(true);
    setScannerError(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle>Add Food to Meal</DialogTitle>
            <DialogClose onClose={onClose} />
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsScannerOpen(true)}
                title="Scan Barcode with Camera"
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan
              </Button>
              <Button
                variant="outline"
                onClick={openManualBarcodeInput}
                title="Enter Barcode Manually"
              >
                Manual
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAddNewFoodOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border rounded-md">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {foodItems.length === 0
                    ? "No food items available"
                    : "No matching food items found"}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded cursor-pointer border transition-colors ${
                        selectedFood?.id === item.id
                          ? foundFromLocalDB
                            ? "bg-blue-500 text-white border-blue-600" // Blue background for local DB finds
                            : "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => {
                        setSelectedFood(item);
                        setFoundFromLocalDB(false); // Reset when manually selecting
                      }}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm opacity-80">
                        {item.calories} cal per 100g • P: {item.proteins}g • C:{" "}
                        {item.carbohydrates}g • F: {item.fat}g
                      </div>
                      {selectedFood?.id === item.id && foundFromLocalDB && (
                        <div className="text-xs mt-1 opacity-90">
                          📱 Found in local database
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedFood && (
              <div className="border-t pt-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Quantity (grams)
                    </label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      min="1"
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-muted p-3 rounded">
                    <div className="font-medium mb-2">
                      Nutritional Information ({quantity}g)
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-semibold">
                          {Math.round((selectedFood.calories * quantity) / 100)}
                        </div>
                        <div className="text-muted-foreground">Calories</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {Math.round((selectedFood.proteins * quantity) / 100)}
                          g
                        </div>
                        <div className="text-muted-foreground">Protein</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {Math.round(
                            (selectedFood.carbohydrates * quantity) / 100
                          )}
                          g
                        </div>
                        <div className="text-muted-foreground">Carbs</div>
                      </div>
                      <div>
                        <div className="font-semibold">
                          {Math.round((selectedFood.fat * quantity) / 100)}g
                        </div>
                        <div className="text-muted-foreground">Fat</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddFood}>Add to Meal</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddNewFoodModal
        isOpen={isAddNewFoodOpen}
        onClose={() => setIsAddNewFoodOpen(false)}
        onFoodAdded={handleNewFoodAdded}
      />

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setIsScannerOpen(false)}
          onError={handleScannerError}
        />
      )}

      {scannerError && (
        <Dialog open={true} onOpenChange={closeScannerError}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isSearchingAPI ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching...</span>
                  </div>
                ) : (
                  "Barcode Scan Result"
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                {isSearchingAPI && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                <p
                  className={`text-sm ${
                    scannerError.includes("✅")
                      ? "text-green-600 font-medium"
                      : scannerError.includes("🔍")
                      ? "text-blue-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {scannerError}
                </p>
              </div>
              {!isSearchingAPI && (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeScannerError}>
                    {scannerError.includes("✅") ? "Close" : "Cancel"}
                  </Button>
                  {scannerError.includes("No nutrition data found") && (
                    <Button
                      onClick={() => {
                        closeScannerError();
                        setIsAddNewFoodOpen(true);
                      }}
                    >
                      Add New Food
                    </Button>
                  )}
                  {scannerError.includes("Unable to access camera") && (
                    <Button
                      onClick={() => {
                        closeScannerError();
                        openManualBarcodeInput();
                      }}
                    >
                      Enter Manually
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showManualBarcodeInput && (
        <Dialog
          open={true}
          onOpenChange={() => setShowManualBarcodeInput(false)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Barcode Manually</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Barcode Number</label>
                <Input
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="e.g., 1234567890123"
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleManualBarcodeSubmit();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the barcode number found on the product package
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManualBarcodeInput(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleManualBarcodeSubmit}>
                  Search Product
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AddFoodModal;
