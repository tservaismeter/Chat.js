import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useOpenAiGlobal } from "../../use-openai-global";

function formatCents(value) {
  if (typeof value !== "number") return value ?? "–";
  return value.toFixed(2);
}

function formatDollars(value) {
  if (typeof value !== "number") return null;
  return value.toFixed(2);
}

function PlanCard({ plan, formatCents, formatDollars }) {
  const monthlyEstimate = formatDollars(plan.monthlyEstimate);

  return (
    <div className="min-w-[200px] max-w-[200px] flex-shrink-0 flex flex-col p-4 bg-white border border-black/10 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Retailer */}
      <div className="text-[11px] text-black/50 uppercase tracking-wide truncate">
        {plan.retailer}
      </div>

      {/* Plan name */}
      <div className="text-sm font-medium text-black mt-1 line-clamp-2 leading-snug">
        {plan.name}
      </div>

      {/* Rate - hero metric */}
      <div className="mt-3">
        <span className="text-2xl font-semibold text-black tabular-nums">
          {formatCents(plan.energyRate)}
        </span>
        <span className="text-xs text-black/50 ml-0.5">cents/kWh</span>
      </div>

      {/* Monthly estimate */}
      {monthlyEstimate && (
        <div className="text-xs text-black/60 mt-1">
          ~${monthlyEstimate}/mo
        </div>
      )}

      {/* CTA */}
      {plan.signupUrl && (
        <a
          href={plan.signupUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-[#183a51] text-white px-3 py-2 text-xs font-medium hover:opacity-90 transition"
        >
          Sign up
        </a>
      )}
    </div>
  );
}

function App() {
  const payload = useOpenAiGlobal("toolOutput");

  const plans = Array.isArray(payload?.plans) ? payload.plans : [];
  const criteria = payload?.criteria ?? {};

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    containScroll: "trimSnaps",
  });

  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    update();
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
  }, [emblaApi]);

  if (plans.length === 0) {
    return (
      <div className="antialiased w-full text-black py-10 text-center text-black/60">
        No plans available. Try a different ZIP or contract length.
      </div>
    );
  }

  return (
    <div className="antialiased w-full text-black relative py-2">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {plans.map((plan, index) => (
            <PlanCard
              key={`${plan.id || plan.retailer}-${plan.name}-${index}`}
              plan={plan}
              formatCents={formatCents}
              formatDollars={formatDollars}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      {canPrev && (
        <button
          type="button"
          aria-label="Previous"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-black/10 text-black/70 shadow-sm hover:bg-black/5 transition flex items-center justify-center"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Next"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white border border-black/10 text-black/70 shadow-sm hover:bg-black/5 transition flex items-center justify-center"
          onClick={() => emblaApi?.scrollNext()}
        >
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

const rootElement = document.getElementById("get-plans-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
export { App };
