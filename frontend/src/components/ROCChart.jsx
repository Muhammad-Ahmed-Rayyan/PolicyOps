import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { API_URL } from "../config";

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
      .then((res) => {
        if (res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
          const hasValidCurves = Object.values(res.data).some(
            (item) => item && Array.isArray(item.fpr) && Array.isArray(item.tpr)
          );
          if (hasValidCurves) {
            setCurves(res.data);
            return;
          }
        }
        setError("ROC curve data format is invalid.");
      })
      .catch(() => setError("ROC curve data not available yet."));
  }, []);

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          ROC Curve Comparison
        </h3>
        <div className="text-sm text-gray-500 italic">{error}</div>
      </div>
    );
  }

  if (!curves) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          ROC Curve Comparison
        </h3>
        <div className="text-sm text-gray-500">Loading ROC curves...</div>
      </div>
    );
  }

  const validEntries = Object.entries(curves).filter(
    ([, data]) => data && Array.isArray(data.fpr) && Array.isArray(data.tpr)
  );

  if (validEntries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          ROC Curve Comparison
        </h3>
        <div className="text-sm text-gray-500 italic">ROC curve data not available yet.</div>
      </div>
    );
  }

  // Merge all models' points onto a shared set of x-axis (fpr) values
  const allFpr = [...new Set(validEntries.flatMap(([, c]) => c.fpr))].sort((a, b) => a - b);
  const mergedData = allFpr.map((fpr) => {
    const point = { fpr };
    for (const [model, data] of validEntries) {
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
          <Tooltip formatter={(val) => (typeof val === "number" ? val.toFixed(3) : val)} />
          {validEntries.map(([model]) => (
            <Line
              key={model}
              type="monotone"
              dataKey={model}
              stroke={COLORS[model] || "#666"}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-xs">
        {validEntries.map(([model, data]) => (
          <div key={model} className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: COLORS[model] || "#666" }} />
            <span className="text-[var(--color-ink)]">{model}</span>
            <span className="font-[var(--font-mono)] text-gray-500">
              ({typeof data.roc_auc === "number" ? data.roc_auc.toFixed(3) : "N/A"})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}