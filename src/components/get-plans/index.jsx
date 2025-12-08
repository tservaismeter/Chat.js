import React from "react";
import { createRoot } from "react-dom/client";

function formatCents(value) {
  if (typeof value !== "number") return value ?? "–";
  return value.toFixed(2);
}

function formatDollars(value) {
  if (typeof value !== "number") return null;
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

  const plans = Array.isArray(payload?.plans) ? payload.plans : [];
  const criteria = payload?.criteria ?? {};

  return (
    <div className="antialiased w-full text-black px-4 pb-2 border border-black/10 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
      <div className="max-w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 px-4 sm:px-6 py-4">
          <div>
            <div className="text-base sm:text-xl font-semibold">
              Energy Plans Comparison
            </div>
            <div className="text-sm text-black/60">
              Compare plans side-by-side sorted by rate
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-black/70 bg-black/5 rounded-xl px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">Zip</span>
              <span className="font-medium">
                {criteria.zipCode ? String(criteria.zipCode) : "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">Usage</span>
              <span className="font-medium">
                {typeof criteria.usageKwh === "number"
                  ? `${criteria.usageKwh.toLocaleString()} kWh`
                  : "1000 kWh"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">Term</span>
              <span className="font-medium">
                {criteria.termMonths
                  ? `${criteria.termMonths}-month`
                  : "Any"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wide text-black/40">Green</span>
              <span className="font-medium">
                {criteria.renewableOnly ? "Yes" : "All"}
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs uppercase tracking-wide text-black/50">
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Est. Monthly</th>
                <th className="px-4 py-3 font-medium text-center">Term</th>
                <th className="px-4 py-3 font-medium text-center">Green</th>
                <th className="px-4 py-3 font-medium text-right">Cancel Fee</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-black/60">
                    No plans available. Try a different ZIP or contract length.
                  </td>
                </tr>
              )}
              {plans.map((plan, index) => {
                const monthlyEstimate = formatDollars(plan.monthlyEstimate);
                return (
                  <tr
                    key={`${plan.id || plan.provider}-${plan.planName}-${index}`}
                    className="border-b border-black/5 hover:bg-black/[0.02] transition"
                  >
                    <td className="px-4 py-3">
                      <span className="text-black/70">{plan.provider}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-black">{plan.planName}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-black">
                        {formatCents(plan.rateCentsPerKwh)}
                      </span>
                      <span className="text-black/50 ml-1">¢/kWh</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {monthlyEstimate ? (
                        <span className="text-black/70">${monthlyEstimate}</span>
                      ) : (
                        <span className="text-black/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-black/70">
                        {plan.contractLengthMonths ? `${plan.contractLengthMonths}mo` : "Var"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {plan.greenEnergy ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#ECFDF5] text-[#047857] text-xs font-bold">
                          ✓
                        </span>
                      ) : (
                        <span className="text-black/30">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-black/60">{plan.cancellationFee || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {plan.link && (
                        <a
                          href={plan.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-full bg-[#2563EB] text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-black/5 text-xs text-black/50">
          Rates shown include estimated TDU delivery charges. Confirm current rates with provider before enrolling.
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("get-plans-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
export { App };
