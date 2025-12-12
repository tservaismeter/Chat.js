import React from "react";
import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../use-openai-global";

function formatDollars(value) {
  if (typeof value !== "number") return "—";
  return value.toFixed(2);
}

function App() {
  const payload = useOpenAiGlobal("toolOutput");

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
                    {plan.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-black/60">
                    {plan.retailerLogo && (
                      <img
                        src={plan.retailerLogo}
                        alt=""
                        className="h-4 w-auto max-w-[60px] object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>{plan.retailer}</span>
                  </div>
                </div>
                {plan.renewablePercent > 0 && (
                  <span className="text-[#047857] bg-[#ECFDF5] px-2.5 py-1 rounded-full text-xs font-medium">
                    {plan.renewablePercent}% Renewable
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
                <span>Energy rate</span>
                <span>{plan.energyRate?.toFixed(2)} ¢/kWh</span>
              </div>
              {breakdown && (
                <>
                  <div className="flex justify-between text-black/70">
                    <span>Energy charge</span>
                    <span>${formatDollars(breakdown.energyCharge)}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>Retailer base fee</span>
                    <span>${formatDollars(breakdown.retailerBaseFee)}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>{breakdown.utilityName || 'TDU'} delivery</span>
                    <span>${formatDollars(breakdown.tduDeliveryCharge)}</span>
                  </div>
                  <div className="flex justify-between text-black/70">
                    <span>{breakdown.utilityName || 'TDU'} base fee</span>
                    <span>${formatDollars(breakdown.tduBaseFee)}</span>
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
              {plan.termLengthMonths}-month contract{plan.etf != null && ` • $${plan.etf} ETF`}
              {plan.eflUrl && (
                <>
                  {' • '}
                  <a
                    href={plan.eflUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View EFL
                  </a>
                </>
              )}
            </div>

            {/* Sign Up Link */}
            {plan.signupUrl && (
              <div className="mt-4 text-center">
                <a
                  href={plan.signupUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[#2563EB] text-white px-6 py-2.5 text-sm font-medium hover:opacity-90 transition"
                >
                  Sign up for this plan
                </a>
              </div>
            )}
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
