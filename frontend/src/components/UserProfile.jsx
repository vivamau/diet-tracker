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
  Download,
  Edit3,
  Check,
  X,
  Ruler,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import ConfirmModal from "./ui/confirm-modal";
import WeightTrendChart from "./WeightTrendChart";
import { useToast } from "../hooks/useToast";
import { apiGet, apiPost, apiPut, apiDelete } from "../lib/api";

const UserProfile = ({ onBack, onProfileUpdate }) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: "",
    initialWeight: null,
    height: null,
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
  const [newWeightTime, setNewWeightTime] = useState(
    new Date().toTimeString().substring(0, 5)
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPersonalInfo, setEditingPersonalInfo] = useState(false);
  const [tempPersonalInfo, setTempPersonalInfo] = useState({
    name: "",
    initialWeight: null,
    height: null,
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Fetch user profile and weight data
  useEffect(() => {
    fetchProfile();
    fetchWeightEntries();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiGet(
        import.meta.env.VITE_URL_BE + "/api/user/profile"
      );
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
      const response = await apiGet(
        import.meta.env.VITE_URL_BE + "/api/user/weight"
      );
      const data = await response.json();
      setWeightEntries(data);
    } catch (error) {
      console.error("Error fetching weight entries:", error);
    }
  };

  const saveProfile = async (isPersonalInfo = false) => {
    try {
      setSaving(true);
      const response = await apiPut(
        import.meta.env.VITE_URL_BE + "/api/user/profile",
        profile
      );

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        const message = isPersonalInfo
          ? "Personal information saved successfully!"
          : "Nutrition targets saved successfully!";
        toast.success(message, {
          title: "Profile Updated",
        });
        // Notify parent component about the profile update
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        toast.error("Failed to save profile. Please try again.", {
          title: "Save Failed",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Network error occurred while saving profile.", {
        title: "Save Failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const startEditingPersonalInfo = () => {
    setTempPersonalInfo({
      name: profile.name,
      initialWeight: profile.initialWeight,
      height: profile.height,
    });
    setEditingPersonalInfo(true);
  };

  const cancelEditingPersonalInfo = () => {
    setEditingPersonalInfo(false);
    setTempPersonalInfo({
      name: "",
      initialWeight: null,
      height: null,
    });
  };

  const showPersonalInfoConfirmation = () => {
    setConfirmModal({
      isOpen: true,
      title: "Save Personal Information",
      message:
        "Are you sure you want to save these changes to your personal information?",
      onConfirm: () => confirmSavePersonalInfo(),
    });
  };

  const confirmSavePersonalInfo = async () => {
    setConfirmModal({ ...confirmModal, isOpen: false });

    // Update profile with temp values
    setProfile((prev) => ({
      ...prev,
      name: tempPersonalInfo.name,
      initialWeight: tempPersonalInfo.initialWeight,
      height: tempPersonalInfo.height,
    }));

    // Save the updated profile
    const updatedProfile = {
      ...profile,
      name: tempPersonalInfo.name,
      initialWeight: tempPersonalInfo.initialWeight,
      height: tempPersonalInfo.height,
    };

    try {
      setSaving(true);
      const response = await apiPut(
        import.meta.env.VITE_URL_BE + "/api/user/profile",
        updatedProfile
      );

      if (response.ok) {
        const savedProfile = await response.json();
        setProfile(savedProfile);
        setEditingPersonalInfo(false);
        toast.success("Personal information saved successfully!", {
          title: "Profile Updated",
        });
        if (onProfileUpdate) {
          onProfileUpdate();
        }
      } else {
        toast.error("Failed to save personal information. Please try again.", {
          title: "Save Failed",
        });
      }
    } catch (error) {
      console.error("Error saving personal information:", error);
      toast.error("Network error occurred while saving personal information.", {
        title: "Save Failed",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTempPersonalInfo = (field, value) => {
    setTempPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addWeightEntry = async () => {
    if (!newWeight || !newWeightDate || !newWeightTime) {
      toast.warning("Please fill in all fields: weight, date, and time.", {
        title: "Missing Information",
      });
      return;
    }

    try {
      const response = await apiPost(
        import.meta.env.VITE_URL_BE + "/api/user/weight",
        {
          date: newWeightDate,
          time: newWeightTime,
          weight: parseFloat(newWeight),
        }
      );

      if (response.ok) {
        await fetchWeightEntries();
        setNewWeight("");
        setNewWeightDate(new Date().toISOString().split("T")[0]);
        setNewWeightTime(new Date().toTimeString().substring(0, 5));
        toast.success("Weight entry added successfully!", {
          title: "Entry Added",
        });
      } else {
        toast.error("Failed to add weight entry. Please try again.", {
          title: "Add Failed",
        });
      }
    } catch (error) {
      console.error("Error adding weight entry:", error);
      toast.error("Network error occurred while adding weight entry.", {
        title: "Add Failed",
      });
    }
  };

  const showDeleteConfirmation = (date) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Weight Entry",
      message:
        "Are you sure you want to delete this weight entry? This action cannot be undone.",
      onConfirm: () => confirmDeleteWeightEntry(date),
    });
  };

  const confirmDeleteWeightEntry = async (date) => {
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      const response = await apiDelete(
        import.meta.env.VITE_URL_BE + `/api/user/weight/${date}`
      );
      if (response.ok) {
        await fetchWeightEntries();
        toast.success("Weight entry deleted successfully!", {
          title: "Entry Deleted",
        });
      } else {
        toast.error("Failed to delete weight entry. Please try again.", {
          title: "Delete Failed",
        });
      }
    } catch (error) {
      console.error("Error deleting weight entry:", error);
      toast.error("Network error occurred while deleting weight entry.", {
        title: "Delete Failed",
      });
    }
  };

  const exportFoodDiary = async () => {
    try {
      const response = await apiGet(
        import.meta.env.VITE_URL_BE + "/api/meals/export"
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "food_diary_export.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success("Food diary exported successfully!", {
          title: "Export Complete",
        });
      } else {
        toast.error("Failed to export food diary. Please try again.", {
          title: "Export Failed",
        });
      }
    } catch (error) {
      console.error("Error exporting food diary:", error);
      toast.error("Network error occurred while exporting food diary.", {
        title: "Export Failed",
      });
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </div>
                {!editingPersonalInfo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startEditingPersonalInfo}
                    className="flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingPersonalInfo ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={tempPersonalInfo.name}
                      onChange={(e) =>
                        updateTempPersonalInfo("name", e.target.value)
                      }
                      placeholder="Enter your name"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium flex items-center space-x-2">
                        <Scale className="h-4 w-4" />
                        <span>Initial Weight (kg)</span>
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempPersonalInfo.initialWeight || ""}
                        onChange={(e) =>
                          updateTempPersonalInfo(
                            "initialWeight",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="Enter your initial weight"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center space-x-2">
                        <Ruler className="h-4 w-4" />
                        <span>Height (cm)</span>
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tempPersonalInfo.height || ""}
                        onChange={(e) =>
                          updateTempPersonalInfo(
                            "height",
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="Enter your height"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={cancelEditingPersonalInfo}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </Button>
                    <Button
                      onClick={showPersonalInfoConfirmation}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>{saving ? "Saving..." : "Save Changes"}</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                      {profile.name || "Not specified"}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium flex items-center space-x-2">
                        <Scale className="h-4 w-4" />
                        <span>Initial Weight</span>
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                        {profile.initialWeight
                          ? `${profile.initialWeight} kg`
                          : "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium flex items-center space-x-2">
                        <Ruler className="h-4 w-4" />
                        <span>Height</span>
                      </label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                        {profile.height
                          ? `${profile.height} cm`
                          : "Not specified"}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Food Diary Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Export Food Diary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Export your complete food diary including all meals, quantities,
                nutritional information, and timestamps for external analysis.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Export includes:
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Date of each meal</li>
                  <li>• Meal type (breakfast, lunch, dinner, snack)</li>
                  <li>• Food name and quantity consumed</li>
                  <li>
                    • Calories and macro nutrients (proteins, carbs, fats)
                  </li>
                  <li>• Date when food was added to diary</li>
                </ul>
              </div>
              <Button
                onClick={exportFoodDiary}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Food Diary as CSV
              </Button>
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

              {/* Weight Trend Chart */}
              <div className="border-t pt-6">
                <WeightTrendChart weightEntries={weightEntries} />
              </div>

              {/* Add New Weight Entry */}
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">Add Weight Entry</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                  <Input
                    type="date"
                    value={newWeightDate}
                    onChange={(e) => setNewWeightDate(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="time"
                    value={newWeightTime}
                    onChange={(e) => setNewWeightTime(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    placeholder="Weight (kg)"
                    className="w-full"
                  />
                </div>
                <Button onClick={addWeightEntry} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Weight Entry
                </Button>
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
                              {entry.time && (
                                <span className="ml-2 text-blue-600">
                                  at {entry.time}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showDeleteConfirmation(entry.date)}
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

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() =>
          setConfirmModal({
            isOpen: false,
            title: "",
            message: "",
            onConfirm: () => {},
          })
        }
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.title.includes("Save") ? "confirm" : "danger"}
      />
    </div>
  );
};

export default UserProfile;
