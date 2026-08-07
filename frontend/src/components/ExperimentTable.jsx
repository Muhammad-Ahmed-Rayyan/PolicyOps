import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function dedupeBestPerModel(runs) {
  const best = {};
  for (const run of runs) {
    const existing = best[run.model_type];
    if (!existing || run.f1_macro > existing.f1_macro) {
      best[run.model_type] = run;
    }
  }
  return Object.values(best).sort((a, b) => b.f1_macro - a.f1_macro);
}

function MetricCell({ value, isBest }) {
  return (
    <td className={`px-4 py-3 text-sm text-center ${isBest ? "font-bold text-indigo-600" : "text-gray-700"}`}>
      {value?.toFixed(4)}
    </td>
  );
}

export default function ExperimentTable() {
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/experiments`)
      .then((res) => setRuns(dedupeBestPerModel(res.data)))
      .catch(() => setError("Could not load experiment data."));
  }, []);

  if (error) return <div className="text-sm text-gray-500 italic">{error}</div>;
  if (!runs) return <div className="text-sm text-gray-500">Loading experiments...</div>;

  const bestF1 = Math.max(...runs.map((r) => r.f1_macro));
  const bestAuc = Math.max(...runs.map((r) => r.roc_auc));
  const bestAcc = Math.max(...runs.map((r) => r.accuracy));
  const fastest = Math.min(...runs.map((r) => r.training_time_sec));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
        Model Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Model</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">F1 (macro)</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">ROC-AUC</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Accuracy</th>
              <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500 uppercase">Train Time (s)</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.run_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {run.model_type}
                  {run.f1_macro === bestF1 && (
                    <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      Champion
                    </span>
                  )}
                </td>
                <MetricCell value={run.f1_macro} isBest={run.f1_macro === bestF1} />
                <MetricCell value={run.roc_auc} isBest={run.roc_auc === bestAuc} />
                <MetricCell value={run.accuracy} isBest={run.accuracy === bestAcc} />
                <MetricCell value={run.training_time_sec} isBest={run.training_time_sec === fastest} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}