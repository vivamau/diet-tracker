import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

const AddNewFoodModal = ({ isOpen, onClose, onFoodAdded }) => {
  const [formData, setFormData] = useState({
    name: "",
    calories: "",
    proteins: "",
    carbohydrates: "",
    fat: "",
    barcode: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.calories) {
      alert("Name and calories are required");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:3001/api/food-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          calories: parseFloat(formData.calories),
          proteins: parseFloat(formData.proteins) || 0,
          carbohydrates: parseFloat(formData.carbohydrates) || 0,
          fat: parseFloat(formData.fat) || 0,
          barcode: formData.barcode || null,
        }),
      });

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

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Food Item</DialogTitle>
          <DialogClose onClose={handleClose} />
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-sm font-medium">Calories (per 100g) *</label>
            <Input
              type="number"
              value={formData.calories}
              onChange={(e) => handleInputChange("calories", e.target.value)}
              placeholder="e.g., 165"
              min="0"
              step="0.1"
              required
              disabled={isSubmitting}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Barcode (optional)</label>
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
                onChange={(e) => handleInputChange("proteins", e.target.value)}
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Food Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddNewFoodModal;
