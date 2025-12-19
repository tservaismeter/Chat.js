import React from "react";
import { createRoot } from "react-dom/client";
import { useOpenAiGlobal } from "../../use-openai-global";

function formatCents(value) {
  if (typeof value !== "number") return value ?? "–";
  return value.toFixed(2);
}

function formatDollars(value) {
  if (typeof value !== "number") return null;
  return value.toFixed(2);
}

function App() {
  const payload = useOpenAiGlobal("toolOutput");

  const plans = Array.isArray(payload?.plans) ? payload.plans : [];
  const criteria = payload?.criteria ?? {};

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 px-4 sm:px-6 py-4">
          <div>
            <div className="text-base sm:text-xl font-semibold">
              Texas Retail Energy Plans
            </div>
            <div className="text-sm text-black/60">
              Sorted by estimated monthly cost including TDU charges.
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-black/70 bg-black/5 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">
                Zip
              </span>
              <span className="font-medium">
                {criteria.zipCode ? String(criteria.zipCode) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">
                Usage
              </span>
              <span className="font-medium">
                {typeof criteria.usageKwh === "number"
                  ? `${criteria.usageKwh.toLocaleString()} kWh`
                  : "1000 kWh"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">
                Term
              </span>
              <span className="font-medium">
                {criteria.termMonths
                  ? `${criteria.termMonths}-month`
                  : "Any length"}
              </span>
            </div>
          </div>
        </div>
        <div className="min-w-full flex flex-col text-sm">
          {plans.length === 0 && (
            <div className="px-6 py-10 text-center text-black/60">
              No plans available for this request. Try a different ZIP or
              contract length.
            </div>
          )}

          {plans.map((plan, index) => {
            const monthlyEstimate = formatDollars(plan.monthlyEstimate);

            return (
              <div
                key={`${plan.retailer}-${plan.name}-${index}`}
                className="px-4 sm:px-6 py-4 -mx-1 sm:-mx-2 rounded-2xl hover:bg-black/5 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-black/50 uppercase tracking-wide mb-1">
                      {plan.retailerLogo && (
                        <img
                          src={plan.retailerLogo}
                          alt=""
                          className="h-4 w-auto max-w-[80px] object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span>{plan.retailer || "Unknown retailer"}</span>
                      {plan.googleRating && (
                        <span className="text-black/60 normal-case flex items-center gap-1">
                          • <span className="text-amber-500">★</span> {plan.googleRating}
                        </span>
                      )}
                      {plan.renewablePercent > 0 && (
                        <span className="text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-full normal-case text-[11px] font-medium">
                          {plan.renewablePercent}% Renewable
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-medium text-black truncate">
                      {plan.name || "Unnamed plan"}
                    </div>
                  </div>
                  <div className="sm:w-40">
                    <div className="text-lg font-semibold text-black">
                      {formatCents(plan.energyRate)}
                      <span className="text-sm text-black/50 ml-1">¢/kWh</span>
                    </div>
                    {monthlyEstimate && (
                      <div className="text-xs text-black/60 mt-1">
                        ≈ ${monthlyEstimate} / month
                      </div>
                    )}
                    <div className="text-xs text-black/50 mt-1">
                      {plan.termLengthMonths
                        ? `${plan.termLengthMonths}-month term`
                        : "Variable term"}
                    </div>
                    {plan.baseFee > 0 && (
                      <div className="text-xs text-black/50">
                        Base fee: ${formatDollars(plan.baseFee)}/mo
                      </div>
                    )}
                    {plan.etf != null && (
                      <div className="text-xs text-black/50">
                        ETF: ${plan.etf}
                      </div>
                    )}
                  </div>
                  <div className="sm:w-32 flex flex-col gap-1">
                    {plan.signupUrl && (
                      <a
                        href={plan.signupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-full sm:w-auto rounded-full bg-[#2563EB] text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition"
                      >
                        Sign up
                      </a>
                    )}
                    {plan.eflUrl && (
                      <a
                        href={plan.eflUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline text-center"
                      >
                        View EFL
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-black/5 text-xs text-black/50">
          Pricing shown is illustrative and includes estimated TDU charges. Always
          confirm current rates and terms with the provider before enrolling.
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("energy-plans-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
export { App };
