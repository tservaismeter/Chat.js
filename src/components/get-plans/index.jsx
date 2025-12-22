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

function StarRating({ rating, max = 5 }) {
  return (
    <div className="flex items-center">
      {[...Array(max)].map((_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <div key={i} className="relative w-2.5 h-2.5 text-[10px] leading-none">
            {/* Empty star (background) */}
            <span className="absolute inset-0 text-black/20 dark:text-white/20">★</span>
            {/* Filled portion */}
            <span
              className="absolute inset-0 text-amber-500 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </div>
        );
      })}
      <span className="ml-1 text-[10px] text-black/40 dark:text-white/40">
        {rating}
      </span>
    </div>
  );
}

function PlanCard({ plan, formatCents, formatDollars }) {
  const monthlyEstimate = formatDollars(plan.monthlyEstimate);

  return (
    <div className="min-w-[200px] max-w-[200px] flex-shrink-0 flex flex-col p-4 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Retailer logo - fixed height for alignment */}
      <div className="h-10 flex items-center text-[11px] text-black/50 dark:text-white/50 uppercase tracking-wide">
        {plan.retailerLogo ? (
          <img
            src={plan.retailerLogo}
            alt={plan.retailer}
            className="h-10 w-auto max-w-[140px] object-contain dark:bg-white/90 dark:rounded dark:px-1.5 dark:py-0.5"
            onError={(e) => {
              // Hide broken image and show fallback text
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
        ) : null}
        <span
          className="truncate"
          style={{ display: plan.retailerLogo ? 'none' : 'block' }}
        >
          {plan.retailer}
        </span>
      </div>

      {/* Plan name */}
      <div className="text-sm font-medium text-black dark:text-white mt-1 line-clamp-2 leading-snug">
        {plan.name}
      </div>

      {/* Star rating - fixed height for alignment */}
      <div className="h-4 flex items-center mt-0.5">
        {plan.googleRating ? (
          <StarRating rating={plan.googleRating} />
        ) : null}
      </div>

      {/* Rate - hero metric */}
      <div className="mt-2">
        <span className="text-2xl font-semibold text-black dark:text-white tabular-nums">
          {formatCents(plan.energyRate)}
        </span>
        <span className="text-xs text-black/50 dark:text-white/50 ml-0.5">cents/kWh</span>
      </div>

      {/* Monthly estimate */}
      <div className="h-4 text-xs text-black/60 dark:text-white/60 mt-1">
        {monthlyEstimate ? `~$${monthlyEstimate}/mo` : null}
      </div>

      {/* CTA - pushed to bottom */}
      <div className="mt-auto pt-3">
        {(plan.signupUrl || plan.retailerWebsite) && (
          <a
            href={plan.signupUrl || plan.retailerWebsite}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-full rounded-full bg-[#183a51] text-white px-3 py-2 text-xs font-medium hover:opacity-90 transition"
          >
            Sign up
          </a>
        )}

        {/* EFL link */}
        {plan.eflUrl && (
          <a
            href={plan.eflUrl}
            target="_blank"
            rel="noreferrer"
            className="block mt-2 text-[10px] text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 text-center transition"
          >
            View plan details (EFL)
          </a>
        )}
      </div>
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

  if (payload && plans.length === 0) {
    return (
      <div className="antialiased w-full text-black dark:text-white py-10 text-center text-black/60 dark:text-white/60">
        No plans available. Try a different ZIP or contract length.
      </div>
    );
  }

  return (
    <div className="antialiased w-full text-black dark:text-white relative py-2">
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
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center"
          onClick={() => emblaApi?.scrollPrev()}
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          aria-label="Next"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-black/70 dark:text-white/70 shadow-sm hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center justify-center"
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
