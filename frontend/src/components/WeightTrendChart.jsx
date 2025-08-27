import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const WeightTrendChart = ({ weightEntries }) => {
  // Function to handle CSV export
  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3001"
        }/api/user/weight/export`
      );

      if (!response.ok) {
        throw new Error("Failed to export weight data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "weight_data.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export weight data. Please try again.");
    }
  };

  // Prepare data for the chart
  const chartData = weightEntries
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({
      date: entry.date,
      weight: entry.weight,
      formattedDate: new Date(entry.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

  // Calculate trend
  const getTrend = () => {
    if (chartData.length < 2) return null;

    const firstWeight = chartData[0].weight;
    const lastWeight = chartData[chartData.length - 1].weight;
    const change = lastWeight - firstWeight;

    return {
      direction: change >= 0 ? "up" : "down",
      value: Math.abs(change).toFixed(1),
      percentage: ((Math.abs(change) / firstWeight) * 100).toFixed(1),
    };
  };

  const trend = getTrend();

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-800">
            {new Date(label).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-blue-600 font-bold">Weight: {data.value}kg</p>
        </div>
      );
    }
    return null;
  };

  if (weightEntries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Weight Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No weight data available</p>
            <p className="text-sm">Add weight entries to see your trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (weightEntries.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Weight Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {weightEntries[0].weight}kg
            </div>
            <p>Add more entries to see your trend</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Weight Trend</span>
          </div>
          <div className="flex items-center space-x-2">
            {trend && (
              <div
                className={`flex items-center space-x-1 text-sm ${
                  trend.direction === "up" ? "text-red-600" : "text-green-600"
                }`}
              >
                {trend.direction === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {trend.value}kg ({trend.percentage}%)
                </span>
              </div>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Export weight data as CSV"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="formattedDate" stroke="#6b7280" fontSize={12} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                domain={["dataMin - 1", "dataMax + 1"]}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                activeDot={{
                  r: 7,
                  stroke: "#3b82f6",
                  strokeWidth: 2,
                  fill: "#ffffff",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <div className="font-medium text-blue-700">Latest</div>
            <div className="text-lg font-bold text-blue-800">
              {chartData[chartData.length - 1].weight}kg
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700">Entries</div>
            <div className="text-lg font-bold text-gray-800">
              {chartData.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeightTrendChart;
