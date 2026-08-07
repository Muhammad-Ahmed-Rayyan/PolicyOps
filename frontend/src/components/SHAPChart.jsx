import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

function cleanLabel(key) {
  // strips the "num__" / "cat__" prefix added by the sklearn ColumnTransformer
  return key.replace(/^(num__|cat__)/, "").replace(/_/g, " ");
}

export default function SHAPChart({ result }) {
  if (!result) return null;

  const data = Object.entries(result.shap_values)
    .map(([key, value]) => ({ name: cleanLabel(key), value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  const riskColor = {
    Low: "text-green-600 bg-green-50 border-green-200",
    Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
    High: "text-red-600 bg-red-50 border-red-200",
  }[result.risk_level] || "text-gray-600 bg-gray-50 border-gray-200";

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Prediction Result
        </h3>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${riskColor}`}>
          {result.risk_level} Risk
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-gray-50 rounded-md py-3">
          <div className="text-xs text-gray-500">Probability</div>
          <div className="text-lg font-bold text-gray-900">{(result.probability * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 rounded-md py-3">
          <div className="text-xs text-gray-500">Baseline Risk</div>
          <div className="text-lg font-bold text-gray-900">{(result.baseline_risk * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 rounded-md py-3">
          <div className="text-xs text-gray-500">Model Version</div>
          <div className="text-lg font-bold text-gray-900">v{result.model_version}</div>
        </div>
      </div>

      <div>
        <div className="text-xs text-gray-500 mb-2">
          Top factors driving this prediction (SHAP values)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(val) => val.toFixed(4)} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.value > 0 ? "#dc2626" : "#16a34a"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-600 rounded-sm inline-block" /> Increases risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-600 rounded-sm inline-block" /> Decreases risk
          </span>
        </div>
      </div>
    </div>
  );
}