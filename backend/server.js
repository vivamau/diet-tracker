const express = require("express");
const cors = require("cors");
const { join } = require("path");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbFile = join(__dirname, "db.json");
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { meals: {}, foodItems: {} });

// Initialize database with default structure
async function initDb() {
  await db.read();
}

// Utility function to get or create daily meals
function getDailyMeals(date) {
  if (!db.data.meals[date]) {
    db.data.meals[date] = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
  }
  return db.data.meals[date];
}

// Routes

// Get meals for a specific date
app.get("/api/meals/:date", async (req, res) => {
  try {
    const { date } = req.params;
    await db.read();

    const dailyMeals = getDailyMeals(date);
    res.json(dailyMeals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meals" });
  }
});

// Add food item to a meal
app.post("/api/meals/:date/:mealType", async (req, res) => {
  try {
    const { date, mealType } = req.params;
    const { foodItemId, quantity } = req.body;

    await db.read();

    const dailyMeals = getDailyMeals(date);

    if (!dailyMeals[mealType]) {
      return res.status(400).json({ error: "Invalid meal type" });
    }

    const mealEntry = {
      id: uuidv4(),
      foodItemId,
      quantity: quantity || 1,
      addedAt: new Date().toISOString(),
    };

    dailyMeals[mealType].push(mealEntry);
    await db.write();

    res.json(mealEntry);
  } catch (error) {
    res.status(500).json({ error: "Failed to add food item to meal" });
  }
});

// Remove food item from a meal
app.delete("/api/meals/:date/:mealType/:mealEntryId", async (req, res) => {
  try {
    const { date, mealType, mealEntryId } = req.params;

    await db.read();

    const dailyMeals = getDailyMeals(date);

    if (!dailyMeals[mealType]) {
      return res.status(400).json({ error: "Invalid meal type" });
    }

    const entryIndex = dailyMeals[mealType].findIndex(
      (entry) => entry.id === mealEntryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ error: "Meal entry not found" });
    }

    dailyMeals[mealType].splice(entryIndex, 1);
    await db.write();

    res.json({ message: "Food item removed from meal" });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove food item from meal" });
  }
});

// Get all food items
app.get("/api/food-items", async (req, res) => {
  try {
    await db.read();
    const foodItems = Object.values(db.data.foodItems);
    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch food items" });
  }
});

// Get specific food item
app.get("/api/food-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.read();

    const foodItem = db.data.foodItems[id];

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch food item" });
  }
});

// Create new food item
app.post("/api/food-items", async (req, res) => {
  try {
    const {
      name,
      calories,
      fat,
      carbohydrates,
      proteins,
      unit = "grams",
      barcode,
    } = req.body;

    if (!name || calories === undefined) {
      return res.status(400).json({ error: "Name and calories are required" });
    }

    await db.read();

    // Check if barcode already exists
    if (barcode) {
      const existingItem = Object.values(db.data.foodItems).find(
        (item) => item.barcode === barcode
      );
      if (existingItem) {
        return res
          .status(400)
          .json({ error: "Food item with this barcode already exists" });
      }
    }

    const foodItem = {
      id: uuidv4(),
      name,
      calories: parseFloat(calories),
      fat: parseFloat(fat) || 0,
      carbohydrates: parseFloat(carbohydrates) || 0,
      proteins: parseFloat(proteins) || 0,
      unit,
      barcode: barcode || null,
      createdAt: new Date().toISOString(),
    };

    db.data.foodItems[foodItem.id] = foodItem;
    await db.write();

    res.status(201).json(foodItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to create food item" });
  }
});

// Update food item
app.put("/api/food-items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, calories, fat, carbohydrates, proteins, unit, barcode } =
      req.body;

    await db.read();

    const foodItem = db.data.foodItems[id];

    if (!foodItem) {
      return res.status(404).json({ error: "Food item not found" });
    }

    // Check if barcode already exists (if updating barcode)
    if (barcode && barcode !== foodItem.barcode) {
      const existingItem = Object.values(db.data.foodItems).find(
        (item) => item.barcode === barcode && item.id !== id
      );
      if (existingItem) {
        return res
          .status(400)
          .json({ error: "Food item with this barcode already exists" });
      }
    }

    // Update fields if provided
    if (name !== undefined) foodItem.name = name;
    if (calories !== undefined) foodItem.calories = parseFloat(calories);
    if (fat !== undefined) foodItem.fat = parseFloat(fat);
    if (carbohydrates !== undefined)
      foodItem.carbohydrates = parseFloat(carbohydrates);
    if (proteins !== undefined) foodItem.proteins = parseFloat(proteins);
    if (unit !== undefined) foodItem.unit = unit;
    if (barcode !== undefined) foodItem.barcode = barcode || null;

    foodItem.updatedAt = new Date().toISOString();

    await db.write();

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to update food item" });
  }
});

// Search food items by name
app.get("/api/food-items/search/:query", async (req, res) => {
  try {
    const { query } = req.params;
    await db.read();

    const foodItems = Object.values(db.data.foodItems);
    const filteredItems = foodItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json(filteredItems);
  } catch (error) {
    res.status(500).json({ error: "Failed to search food items" });
  }
});

// Search food item by barcode
app.get("/api/food-items/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;
    await db.read();

    const foodItem = Object.values(db.data.foodItems).find(
      (item) => item.barcode === barcode
    );

    if (!foodItem) {
      return res
        .status(404)
        .json({ error: "Food item not found for this barcode" });
    }

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: "Failed to search by barcode" });
  }
});

// Start server
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
