import { useState } from "react";
import PredictionForm from "./components/PredictionForm";
import SHAPChart from "./components/SHAPChart";
import ROCChart from "./components/ROCChart";
import ExperimentTable from "./components/ExperimentTable";
import Logo from "./components/Logo";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [result, setResult] = useState(null);

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="bg-[var(--color-ink)] text-white px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <h1 className="font-[var(--font-display)] text-2xl font-bold tracking-tight">
            PolicyOps
          </h1>
          <span className="text-xs uppercase tracking-widest text-white/50">
            Claim Fraud Risk Ledger
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <ErrorBoundary>
            <PredictionForm onResult={setResult} />
          </ErrorBoundary>
          <div className="lg:sticky lg:top-6">
            <ErrorBoundary>
              <SHAPChart result={result} />
            </ErrorBoundary>
          </div>
        </div>

        <div className="mt-8">
          <ErrorBoundary>
            <ROCChart />
          </ErrorBoundary>
        </div>

        <div className="mt-8">
          <ErrorBoundary>
            <ExperimentTable />
          </ErrorBoundary>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-6 text-xs text-gray-400">
        PolicyOps — MLOps fraud detection pipeline. XGBoost champion model, SHAP explainability.
      </footer>
    </div>
  );
}

export default App;