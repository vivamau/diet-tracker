import { useState, useEffect } from "react";
import { Scan, Plus, Loader2, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import BarcodeScanner from "./BarcodeScanner";
import { apiPost } from "../lib/api";

const AddFoodToDatabaseModal = ({ isOpen, onClose, onFoodAdded }) => {
  const [mode, setMode] = useState("options"); // 'options', 'manual', 'create'
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState(null);
  const [showManualBarcodeInput, setShowManualBarcodeInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);

  // Form data for creating new food
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    proteins: "",
    carbohydrates: "",
    fat: "",
    barcode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setMode("options");
      setScannerError(null);
      setIsSearchingAPI(false);
      setManualBarcode("");
      setFormData({
        name: "",
        calories: "",
        proteins: "",
        carbohydrates: "",
        fat: "",
        barcode: "",
      });
    }
  }, [isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateFood = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.calories) {
      alert("Name and calories are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiPost(
        import.meta.env.VITE_URL_BE + "/api/food-items",
        {
          name: formData.name,
          calories: parseFloat(formData.calories),
          proteins: parseFloat(formData.proteins) || 0,
          carbohydrates: parseFloat(formData.carbohydrates) || 0,
          fat: parseFloat(formData.fat) || 0,
          barcode: formData.barcode || null,
        }
      );

      if (response.ok) {
        // Reset form
        setFormData({
          name: "",
          calories: "",
          proteins: "",
          carbohydrates: "",
          fat: "",
          barcode: "",
        });
        onFoodAdded();
        onClose();
      } else {
        alert("Failed to add food item");
      }
    } catch (error) {
      console.error("Error adding food item:", error);
      alert("Failed to add food item");
    } finally {
      setIsSubmitting(false);
    }
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
    setIsSearchingAPI(false);

    try {
      // First, check if food item already exists in our local database
      const localResponse = await fetch(
        import.meta.env.VITE_URL_BE + `/api/food-items/barcode/${barcode}`
      );

      if (localResponse.ok) {
        const foodItem = await localResponse.json();
        setScannerError(
          `⚠️ Food "${foodItem.name}" with this barcode already exists in your database!`
        );
        return;
      }

      // If not found locally, try OpenFoodFacts API
      if (localResponse.status === 404) {
        setIsSearchingAPI(true);
        setScannerError("🔍 Searching OpenFoodFacts database...");

        const openFoodFactsData = await fetchFromOpenFoodFacts(barcode);

        if (openFoodFactsData) {
          // Pre-fill the form with OpenFoodFacts data
          setFormData(openFoodFactsData);
          setMode("create");
          setScannerError(
            "✅ Product found! Review and save to your database."
          );
          setTimeout(() => setScannerError(null), 3000);
        } else {
          // No data found, switch to manual entry with barcode pre-filled
          setFormData((prev) => ({ ...prev, barcode }));
          setMode("create");
          setScannerError(
            `No nutrition data found for barcode ${barcode}. Please enter the details manually.`
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

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Food to Database</DialogTitle>
            <DialogClose onClose={handleClose} />
          </DialogHeader>

          {mode === "options" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Package className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Choose how you'd like to add a new food item
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Scan className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Scan Barcode</div>
                      <div className="text-xs text-muted-foreground">
                        Use your camera to scan product barcode
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={openManualBarcodeInput}
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-5 w-5 text-green-500 font-mono text-sm border rounded flex items-center justify-center">
                      123
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Enter Barcode</div>
                      <div className="text-xs text-muted-foreground">
                        Type the barcode number manually
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => setMode("create")}
                  className="w-full justify-start h-auto p-4"
                  variant="outline"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="h-5 w-5 text-purple-500" />
                    <div className="text-left">
                      <div className="font-medium">Create from Scratch</div>
                      <div className="text-xs text-muted-foreground">
                        Enter all nutritional information manually
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleCreateFood} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Food Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Chicken Breast"
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Calories (per 100g) *
                </label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    handleInputChange("calories", e.target.value)
                  }
                  placeholder="e.g., 165"
                  min="0"
                  step="0.1"
                  required
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">
                  Barcode (optional)
                </label>
                <Input
                  value={formData.barcode}
                  onChange={(e) => handleInputChange("barcode", e.target.value)}
                  placeholder="e.g., 123456789012"
                  disabled={isSubmitting}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium">Protein (g)</label>
                  <Input
                    type="number"
                    value={formData.proteins}
                    onChange={(e) =>
                      handleInputChange("proteins", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                    step="0.1"
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Carbs (g)</label>
                  <Input
                    type="number"
                    value={formData.carbohydrates}
                    onChange={(e) =>
                      handleInputChange("carbohydrates", e.target.value)
                    }
                    placeholder="0"
                    min="0"
                    step="0.1"
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Fat (g)</label>
                  <Input
                    type="number"
                    value={formData.fat}
                    onChange={(e) => handleInputChange("fat", e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.1"
                    disabled={isSubmitting}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                * All nutritional values are per 100 grams
              </div>

              <div className="flex justify-between space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("options")}
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Food"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

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
                      : scannerError.includes("⚠️")
                      ? "text-orange-600 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {scannerError}
                </p>
              </div>
              {!isSearchingAPI && (
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={closeScannerError}>
                    {scannerError.includes("✅") || scannerError.includes("⚠️")
                      ? "Close"
                      : "Cancel"}
                  </Button>
                  {scannerError.includes("No nutrition data found") && (
                    <Button
                      onClick={() => {
                        closeScannerError();
                        setMode("create");
                      }}
                    >
                      Enter Details
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

export default AddFoodToDatabaseModal;
