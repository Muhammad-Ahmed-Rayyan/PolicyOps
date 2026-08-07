import { useState } from "react";
import PredictionForm from "./components/PredictionForm";
import SHAPChart from "./components/SHAPChart";
import ROCChart from "./components/ROCChart";
import ExperimentTable from "./components/ExperimentTable";

function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-900">PolicyOps</h1>
      <p className="text-gray-600 mb-8">Insurance Claim Fraud Risk Dashboard</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <PredictionForm onResult={setResult} />
        <SHAPChart result={result} />
      </div>
      <div className="mt-8">
        <ROCChart />
      </div>
      <div className="mt-8">
        <ExperimentTable />
      </div>
    </div>
  );
}

export default App;