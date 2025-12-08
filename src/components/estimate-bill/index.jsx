import React from "react";
import { createRoot } from "react-dom/client";

function formatDollars(value) {
  if (typeof value !== "number") return "—";
  return value.toFixed(2);
}

function App() {
  const [payload, setPayload] = React.useState(() => {
    if (typeof window !== "undefined" && window.openai?.toolOutput) {
      return window.openai.toolOutput;
    }
    return null;
  });

  React.useEffect(() => {
    if (window.openai?.toolOutput) {
      setPayload(window.openai.toolOutput);
    }
  }, []);

  const estimate = payload?.estimate;
  const plan = payload?.plan;
  const usageKwh = payload?.usageKwh;
  const breakdown = payload?.breakdown;

  const hasData = typeof estimate === "number" && plan;

  return (
    <div className="antialiased w-full text-black px-4 py-4 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-sm text-black/60 uppercase tracking-wide">
            Estimated Monthly Bill
          </div>
        </div>

        {hasData ? (
          <>
            {/* Hero Amount */}
            <div className="text-center py-6">
              <div className="text-5xl sm:text-6xl font-bold text-black">
                ${formatDollars(estimate)}
              </div>
              <div className="text-sm text-black/50 mt-2">per month</div>
            </div>

            {/* Plan Info */}
            <div className="bg-black/[0.03] rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-black/50 uppercase tracking-wide">
                    Plan
                  </div>
                  <div className="font-medium text-black">
                    {plan.planName}
                  </div>
                  <div className="text-sm text-black/60">
                    {plan.provider}
                  </div>
                </div>
                {plan.greenEnergy && (
                  <span className="text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-full text-xs font-medium">
                    100% Renewable
                  </span>
                )}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-black/70">
                <span>Usage</span>
                <span>{usageKwh?.toLocaleString()} kWh</span>
              </div>
              <div className="flex justify-between text-black/70">
                <span>Rate</span>
                <span>{plan.rateCentsPerKwh?.toFixed(2)} ¢/kWh</span>
              </div>
              {breakdown && (
                <>
                  <div className="flex justify-between text-black/70">
                    <span>Energy charge</span>
                    <span>${formatDollars(breakdown.energyCharge)}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>TDU delivery</span>
                    <span>${formatDollars(breakdown.tduFee)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-medium text-black pt-2 border-t border-black/10">
                <span>Total</span>
                <span>${formatDollars(estimate)}</span>
              </div>
            </div>

            {/* Contract Info */}
            <div className="mt-4 pt-4 border-t border-black/5 text-xs text-black/50 text-center">
              {plan.contractLengthMonths}-month contract • {plan.cancellationFee} early termination fee
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-black/60">
            No estimate available. Please provide a plan and usage amount.
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 text-xs text-black/40 text-center">
          Estimate includes TDU charges. Actual bill may vary based on usage patterns.
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("estimate-bill-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
export { App };
