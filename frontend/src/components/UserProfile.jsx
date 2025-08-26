import { useState, useEffect } from "react";
import {
  ArrowLeft,
  User,
  Target,
  Scale,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

const UserProfile = ({ onBack }) => {
  const [profile, setProfile] = useState({
    name: "",
    dailyTargets: {
      calories: 2000,
      proteins: 150,
      carbohydrates: 250,
      fat: 65,
    },
  });
  const [weightEntries, setWeightEntries] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [newWeightDate, setNewWeightDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch user profile and weight data
  useEffect(() => {
    fetchProfile();
    fetchWeightEntries();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiGet("http://localhost:3001/api/user/profile");
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightEntries = async () => {
    try {
      const response = await apiGet("http://localhost:3001/api/user/weight");
      const data = await response.json();
      setWeightEntries(data);
    } catch (error) {
      console.error("Error fetching weight entries:", error);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const response = await apiPut(
        "http://localhost:3001/api/user/profile",
        profile
      );

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        alert("Profile saved successfully!");
      } else {
        alert("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const addWeightEntry = async () => {
    if (!newWeight || !newWeightDate) {
      alert("Please enter both weight and date");
      return;
    }

    try {
      const response = await apiPost("http://localhost:3001/api/user/weight", {
        date: newWeightDate,
        weight: parseFloat(newWeight),
      });

      if (response.ok) {
        await fetchWeightEntries();
        setNewWeight("");
        setNewWeightDate(new Date().toISOString().split("T")[0]);
      } else {
        alert("Failed to add weight entry");
      }
    } catch (error) {
      console.error("Error adding weight entry:", error);
      alert("Failed to add weight entry");
    }
  };

  const deleteWeightEntry = async (date) => {
    if (!confirm("Are you sure you want to delete this weight entry?")) {
      return;
    }

    try {
      const response = await apiDelete(
        `http://localhost:3001/api/user/weight/${date}`
      );
      if (response.ok) {
        await fetchWeightEntries();
      } else {
        alert("Failed to delete weight entry");
      }
    } catch (error) {
      console.error("Error deleting weight entry:", error);
      alert("Failed to delete weight entry");
    }
  };

  const updateProfile = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setProfile((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setProfile((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Calculate weight statistics
  const getWeightStats = () => {
    if (weightEntries.length === 0) return null;

    const sortedEntries = [...weightEntries].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    const firstEntry = sortedEntries[0];
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const currentWeight = lastEntry.weight;
    const startWeight = firstEntry.weight;
    const totalChange = currentWeight - startWeight;

    let recentChange = 0;
    if (sortedEntries.length > 1) {
      const secondLastEntry = sortedEntries[sortedEntries.length - 2];
      recentChange = currentWeight - secondLastEntry.weight;
    }

    return {
      current: currentWeight,
      total: totalChange,
      recent: recentChange,
      entries: sortedEntries.length,
    };
  };

  const weightStats = getWeightStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container mx-auto p-6 max-w-4xl">
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
      <div className="container mx-auto p-6 max-w-4xl">
        <header className="mb-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Diet Tracker</span>
          </Button>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
              User Profile
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Customize your nutrition targets and track your progress
            </p>
          </div>
        </header>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={profile.name}
                  onChange={(e) => updateProfile("name", e.target.value)}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Daily Nutrition Targets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Daily Nutrition Targets</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-blue-700">
                    Daily Calories
                  </label>
                  <Input
                    type="number"
                    value={profile.dailyTargets.calories}
                    onChange={(e) =>
                      updateProfile(
                        "dailyTargets.calories",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-red-700">
                    Protein (g)
                  </label>
                  <Input
                    type="number"
                    value={profile.dailyTargets.proteins}
                    onChange={(e) =>
                      updateProfile(
                        "dailyTargets.proteins",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-green-700">
                    Carbohydrates (g)
                  </label>
                  <Input
                    type="number"
                    value={profile.dailyTargets.carbohydrates}
                    onChange={(e) =>
                      updateProfile(
                        "dailyTargets.carbohydrates",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-yellow-700">
                    Fat (g)
                  </label>
                  <Input
                    type="number"
                    value={profile.dailyTargets.fat}
                    onChange={(e) =>
                      updateProfile(
                        "dailyTargets.fat",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={saveProfile}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Save Nutrition Targets"}
              </Button>
            </CardContent>
          </Card>

          {/* Weight Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="h-5 w-5" />
                <span>Weight Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weight Stats */}
              {weightStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {weightStats.current}kg
                    </div>
                    <div className="text-sm text-blue-600">Current Weight</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-xl font-bold text-purple-700">
                      {weightStats.entries}
                    </div>
                    <div className="text-sm text-purple-600">Total Entries</div>
                  </div>
                  <div
                    className={`text-center p-3 rounded-lg ${
                      weightStats.total >= 0 ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <div
                      className={`text-xl font-bold flex items-center justify-center ${
                        weightStats.total >= 0
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {weightStats.total >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(weightStats.total).toFixed(1)}kg
                    </div>
                    <div
                      className={`text-sm ${
                        weightStats.total >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      Total Change
                    </div>
                  </div>
                  <div
                    className={`text-center p-3 rounded-lg ${
                      weightStats.recent >= 0 ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <div
                      className={`text-xl font-bold flex items-center justify-center ${
                        weightStats.recent >= 0
                          ? "text-red-700"
                          : "text-green-700"
                      }`}
                    >
                      {weightStats.recent >= 0 ? (
                        <TrendingUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 mr-1" />
                      )}
                      {Math.abs(weightStats.recent).toFixed(1)}kg
                    </div>
                    <div
                      className={`text-sm ${
                        weightStats.recent >= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      Recent Change
                    </div>
                  </div>
                </div>
              )}

              {/* Add New Weight Entry */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Add Weight Entry</h3>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={newWeightDate}
                    onChange={(e) => setNewWeightDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Weight (kg)"
                    className="flex-1"
                  />
                  <Button onClick={addWeightEntry}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Weight Entries List */}
              {weightEntries.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Weight History</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {weightEntries
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((entry) => (
                        <div
                          key={entry.date}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{entry.weight}kg</div>
                            <div className="text-sm text-gray-600">
                              {new Date(entry.date).toLocaleDateString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWeightEntry(entry.date)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {weightEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Scale className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No weight entries yet</p>
                  <p className="text-sm">Add your first weight entry above</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
