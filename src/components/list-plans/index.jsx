import React from "react";
import { createRoot } from "react-dom/client";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronRight, ChevronLeft, ArrowLeft, ArrowRight, Star, ExternalLink } from "lucide-react";
import { useOpenAiGlobal } from "../../use-openai-global";

function formatCents(value) {
  if (typeof value !== "number") return value ?? "–";
  return value.toFixed(1);
}

function formatDollars(value) {
  if (typeof value !== "number") return null;
  return value.toFixed(0);
}

// Star rating with SVG gradient partial fills
function StarRating({ rating, reviewsUrl, size = "sm" }) {
  const starSize = size === "lg" ? "w-5 h-5" : "w-3.5 h-3.5";
  const textSize = size === "lg" ? "text-base" : "text-xs";
  const gradientId = React.useId();

  const content = (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5 pointer-events-none">
        {[...Array(5)].map((_, i) => {
          const fill = Math.min(1, Math.max(0, rating - i));

          if (fill === 0) {
            return (
              <Star
                key={i}
                className={`${starSize} fill-black/10 text-black/10 dark:fill-white/10 dark:text-white/10`}
              />
            );
          }

          if (fill === 1) {
            return (
              <Star
                key={i}
                className={`${starSize} fill-amber-400 text-amber-400`}
              />
            );
          }

          // Partial star with gradient
          const partialId = `${gradientId}-${i}`;
          return (
            <svg key={i} viewBox="0 0 24 24" className={starSize}>
              <defs>
                <linearGradient id={partialId}>
                  <stop offset={`${fill * 100}%`} stopColor="#fbbf24" />
                  <stop offset={`${fill * 100}%`} stopColor="rgba(0,0,0,0.1)" />
                </linearGradient>
              </defs>
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill={`url(#${partialId})`}
                stroke={`url(#${partialId})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          );
        })}
      </div>
      <span className={`${textSize} text-black/60 dark:text-white/60`}>
        {rating.toFixed(1)}
      </span>
      {reviewsUrl && size === "lg" && (
        <ExternalLink className="w-3.5 h-3.5 text-black/40 dark:text-white/40" />
      )}
    </div>
  );

  if (reviewsUrl) {
    return (
      <a
        href={reviewsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex hover:opacity-70 transition"
      >
        {content}
      </a>
    );
  }

  return content;
}

// Detail row for plan info
function DetailRow({ label, value, highlight = false }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-black/5 dark:border-white/5 last:border-0">
      <span className="text-sm text-black/60 dark:text-white/60">{label}</span>
      <span className={`text-sm font-medium ${highlight ? "text-green-600 dark:text-green-400" : "text-black dark:text-white"}`}>
        {value}
      </span>
    </div>
  );
}

// Single plan fullscreen slide
function PlanDetailSlide({ plan }) {
  const monthlyEstimate = formatDollars(plan.monthlyEstimate);

  return (
    <div className="min-w-full px-4 flex flex-col">
      {/* Hero Section - Retailer */}
      <div className="text-center py-2">
        {plan.retailerLogo ? (
          <div className="flex justify-center mb-1">
            <img
              src={plan.retailerLogo}
              alt={plan.retailer}
              className="h-10 w-auto max-w-[160px] object-contain dark:bg-white/90 dark:rounded-lg dark:px-2 dark:py-1"
            />
          </div>
        ) : (
          <h2 className="text-lg font-semibold mb-1">{plan.retailer}</h2>
        )}

        {plan.googleRating && (
          <div className="flex justify-center">
            <StarRating
              rating={plan.googleRating}
              reviewsUrl={plan.googleReviewsUrl}
              size="lg"
            />
          </div>
        )}
      </div>

      {/* Rate Hero */}
      <div className="text-center py-3 border-t border-black/10 dark:border-white/10">
        <div className="text-5xl font-bold tabular-nums text-black dark:text-white">
          {formatCents(plan.energyRate)}¢
        </div>
        <div className="text-sm text-black/50 dark:text-white/50">
          per kWh
        </div>
        {monthlyEstimate && (
          <div className="text-base text-black/70 dark:text-white/70 mt-1">
            Est. <span className="font-semibold">${monthlyEstimate}</span>/month
          </div>
        )}
      </div>

      {/* Plan Details - only essential info */}
      <div className="py-2 border-t border-black/10 dark:border-white/10">
        <DetailRow label="Plan" value={plan.name} />
        <DetailRow label="Term" value={`${plan.termLengthMonths} months`} />
        <DetailRow label="Renewable" value={`${plan.renewablePercent}%`} />
        <DetailRow
          label="Early cancellation fee"
          value={plan.etf ? `$${plan.etf}` : "None"}
        />
      </div>

      {/* Actions */}
      <div className="py-2 mt-auto">
        {plan.eflUrl && (
          <a
            href={plan.eflUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1 mb-2 text-xs text-black/50 dark:text-white/50 hover:text-black/70 dark:hover:text-white/70 transition"
          >
            View EFL Document
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {(plan.signupUrl || plan.retailerWebsite) && (
          <a
            href={plan.signupUrl || plan.retailerWebsite}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full rounded-full bg-[#183a51] text-white px-4 py-2.5 text-sm font-medium hover:opacity-90 transition"
          >
            Sign Up
          </a>
        )}
      </div>
    </div>
  );
}

// Fullscreen carousel with swipe navigation
function PlanDetailCarousel({ plans, initialIndex, onBack }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
    startIndex: initialIndex,
  });

  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [canPrev, setCanPrev] = React.useState(false);
  const [canNext, setCanNext] = React.useState(false);

  React.useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap());
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  return (
    <div className="antialiased min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Navigation Header - centered, no back button (ChatGPT provides X) */}
      <div className="flex items-center justify-center px-4 py-2 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <span className="text-sm text-black/60 dark:text-white/60 tabular-nums min-w-[60px] text-center">
            {currentIndex + 1} of {plans.length}
          </span>

          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 transition"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {plans.map((plan, i) => (
            <PlanDetailSlide key={plan.id || i} plan={plan} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile row - tap to open fullscreen detail view
function MobileRow({ plan, onSelect, isLast }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      className={`sm:hidden w-full flex items-center gap-2 py-2 px-2 hover:bg-black/5 dark:hover:bg-white/5 transition ${
        !isLast ? "border-b border-black/5 dark:border-white/5" : ""
      }`}
    >
      {/* Retailer logo or fallback text */}
      <div className="w-16 flex-shrink-0 flex items-center">
        {plan.retailerLogo ? (
          <img
            src={plan.retailerLogo}
            alt={plan.retailer}
            className="h-5 w-auto max-w-[60px] object-contain dark:bg-white/90 dark:rounded dark:px-0.5"
          />
        ) : (
          <span className="truncate text-xs text-black/60 dark:text-white/60">
            {plan.retailer}
          </span>
        )}
      </div>

      {/* Plan name */}
      <span className="flex-1 truncate text-sm font-medium text-black dark:text-white text-left">
        {plan.name}
      </span>

      {/* Rate */}
      <span className="text-sm font-semibold tabular-nums text-black dark:text-white">
        {formatCents(plan.energyRate)}¢
      </span>

      {/* Chevron */}
      <ChevronRight className="h-4 w-4 text-black/30 dark:text-white/30 flex-shrink-0" />
    </button>
  );
}

// Desktop row - all info inline with direct actions
function DesktopRow({ plan, isLast }) {
  return (
    <div
      className={`hidden sm:flex items-center gap-3 py-2 px-2 ${
        !isLast ? "border-b border-black/5 dark:border-white/5" : ""
      }`}
    >
      {/* Retailer logo */}
      <div className="w-24 flex-shrink-0 flex items-center">
        {plan.retailerLogo ? (
          <img
            src={plan.retailerLogo}
            alt={plan.retailer}
            className="h-6 w-auto max-w-[80px] object-contain dark:bg-white/90 dark:rounded dark:px-0.5"
          />
        ) : (
          <span className="truncate text-xs text-black/60 dark:text-white/60">
            {plan.retailer}
          </span>
        )}
      </div>

      {/* Plan name */}
      <span className="flex-1 truncate text-sm font-medium text-black dark:text-white">
        {plan.name}
      </span>

      {/* Rate */}
      <span className="w-14 text-sm font-semibold tabular-nums text-black dark:text-white text-right">
        {formatCents(plan.energyRate)}¢
      </span>

      {/* Term */}
      <span className="w-10 text-xs text-black/50 dark:text-white/50 text-right">
        {plan.termLengthMonths}mo
      </span>

      {/* Rating */}
      <div className="w-20">
        {plan.googleRating ? (
          <StarRating rating={plan.googleRating} reviewsUrl={plan.googleReviewsUrl} size="sm" />
        ) : (
          <span className="text-xs text-black/30 dark:text-white/30">–</span>
        )}
      </div>

      {/* EFL link */}
      <div className="w-8 flex justify-center">
        {plan.eflUrl ? (
          <a
            href={plan.eflUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center w-6 h-6 text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70 transition cursor-pointer"
            title="View EFL Document"
          >
            <ExternalLink className="w-4 h-4 pointer-events-none" />
          </a>
        ) : (
          <span className="text-black/20 dark:text-white/20">–</span>
        )}
      </div>

      {/* Sign Up button */}
      <a
        href={plan.signupUrl || plan.retailerWebsite}
        target="_blank"
        rel="noreferrer"
        className="w-20 flex-shrink-0 rounded-full bg-[#183a51] text-white px-3 py-1.5 text-xs font-medium text-center hover:opacity-90 transition"
      >
        Sign Up
      </a>
    </div>
  );
}

function App() {
  const payload = useOpenAiGlobal("toolOutput");
  const displayMode = useOpenAiGlobal("displayMode");
  const plans = Array.isArray(payload?.plans) ? payload.plans : [];

  const [selectedIndex, setSelectedIndex] = React.useState(null);
  const containerRef = React.useRef(null);

  // Reset selection when ChatGPT closes fullscreen via X button
  React.useEffect(() => {
    if (displayMode === "inline" && selectedIndex !== null) {
      setSelectedIndex(null);
    }
  }, [displayMode]);

  const handleSelect = async (plan, index) => {
    setSelectedIndex(index);
    await window.openai?.requestDisplayMode?.({ mode: "fullscreen" });
  };

  const handleBack = async () => {
    setSelectedIndex(null);
    await window.openai?.requestDisplayMode?.({ mode: "inline" });
  };

  // Notify ChatGPT of widget height
  React.useEffect(() => {
    if (!containerRef.current || selectedIndex !== null) return;

    const notifyHeight = () => {
      const height = containerRef.current?.scrollHeight;
      if (height && window.openai?.notifyIntrinsicHeight) {
        window.openai.notifyIntrinsicHeight(height);
      }
    };

    notifyHeight();
  }, [plans, selectedIndex]);

  // Show fullscreen carousel if a plan is selected
  if (selectedIndex !== null) {
    return (
      <PlanDetailCarousel
        plans={plans}
        initialIndex={selectedIndex}
        onBack={handleBack}
      />
    );
  }

  if (payload && plans.length === 0) {
    return (
      <div className="antialiased w-full text-black dark:text-white py-10 text-center text-black/60 dark:text-white/60">
        No plans available. Try a different ZIP or contract length.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="antialiased w-full text-black dark:text-white">
      {/* Mobile header row */}
      <div className="sm:hidden flex items-center gap-2 px-2 py-1.5 text-[10px] text-black/40 dark:text-white/40 uppercase tracking-wide border-b border-black/10 dark:border-white/10">
        <span className="w-16">Retailer</span>
        <span className="flex-1">Plan</span>
        <span>Rate</span>
        <span className="w-4"></span>
      </div>

      {/* Desktop header row */}
      <div className="hidden sm:flex items-center gap-3 px-2 py-1.5 text-[10px] text-black/40 dark:text-white/40 uppercase tracking-wide border-b border-black/10 dark:border-white/10">
        <span className="w-24">Retailer</span>
        <span className="flex-1">Plan</span>
        <span className="w-14 text-right">Rate</span>
        <span className="w-10 text-right">Term</span>
        <span className="w-20">Rating</span>
        <span className="w-8 text-center">EFL</span>
        <span className="w-20 text-center">Action</span>
      </div>

      {/* Plan rows - render both mobile and desktop versions */}
      {plans.map((plan, i) => (
        <React.Fragment key={plan.id || `${plan.retailer}-${plan.name}-${i}`}>
          <MobileRow
            plan={plan}
            onSelect={(p) => handleSelect(p, i)}
            isLast={i === plans.length - 1}
          />
          <DesktopRow
            plan={plan}
            isLast={i === plans.length - 1}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

const rootElement = document.getElementById("list-plans-root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

export default App;
export { App };
