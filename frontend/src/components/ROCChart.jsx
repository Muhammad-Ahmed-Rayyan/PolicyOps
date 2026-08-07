import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const COLORS = {
  XGBoost: "#4f46e5",
  RandomForest: "#16a34a",
  LogisticRegression: "#dc2626",
  SVM: "#d97706",
  KNN: "#0891b2",
};

export default function ROCChart() {
  const [curves, setCurves] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/experiments/roc-curves`)
      .then((res) => setCurves(res.data))
      .catch(() => setError("ROC curve data not available yet."));
  }, []);

  if (error) {
    return <div className="text-sm text-gray-500 italic">{error}</div>;
  }
  if (!curves) {
    return <div className="text-sm text-gray-500">Loading ROC curves...</div>;
  }

  // Merge all models' points onto a shared set of x-axis (fpr) values
  const allFpr = [...new Set(Object.values(curves).flatMap((c) => c.fpr))].sort((a, b) => a - b);
  const mergedData = allFpr.map((fpr) => {
    const point = { fpr };
    for (const [model, data] of Object.entries(curves)) {
      const closestIdx = data.fpr.reduce((best, val, i) =>
        Math.abs(val - fpr) < Math.abs(data.fpr[best] - fpr) ? i : best, 0);
      point[model] = data.tpr[closestIdx];
    }
    return point;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        ROC Curve Comparison
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={mergedData} margin={{ left: 10, right: 20, top: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            label={{ value: "False Positive Rate", position: "bottom", fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[0, 1]}
            label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fontSize: 11 }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip formatter={(val) => val?.toFixed(3)} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {Object.keys(curves).map((model) => (
            <Line
              key={model}
              type="monotone"
              dataKey={model}
              stroke={COLORS[model] || "#666"}
              dot={false}
              strokeWidth={2}
              name={`${model} (AUC ${curves[model].roc_auc.toFixed(3)})`}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}