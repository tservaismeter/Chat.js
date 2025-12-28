/**
 * Plan service - handles plan queries and calculations
 */

import { supabase } from "./supabase.js";
import { getUtilityForZipcode } from "./light-api.js";
import type {
  EnergyPlan,
  EnergyPlanWithEstimate,
  PlanCriteria,
  PlansResult,
  FrontendPlan,
} from "../types/index.js";

/**
 * Transform database plan to frontend-facing format (camelCase)
 * Uses the pre-calculated effectiveRate and monthlyEstimate from the plan
 */
function transformToFrontendPlan(
  plan: EnergyPlanWithEstimate
): FrontendPlan {
  return {
    id: plan.id,
    name: plan.name,
    retailer: plan.retailer?.name || "Unknown",
    retailerLogo: plan.retailer?.logo_url || null,
    retailerWebsite: plan.retailer?.website || null,
    signupUrl: plan.signup_url,
    etf: plan.etf ? Number(plan.etf) : null,
    termLengthMonths: plan.term_length_months,
    baseFee: Number(plan.base_fee),
    energyRate: (plan.effectiveRate ?? Number(plan.kwh1000)) * 100, // cents/kWh based on usage
    renewablePercent: plan.renewable_percent,
    utility: plan.utility?.name || null,
    utilityCode: plan.utility?.code || null,
    eflUrl: plan.efl_url,
    monthlyEstimate: plan.monthlyEstimate,
    googleRating: plan.retailer?.google_rating ?? null,
    googleReviewsUrl: plan.retailer?.google_reviews_url ?? null,
  };
}

/**
 * Get the effective rate per kWh based on usage level.
 * Interpolates between kwh500, kwh1000, and kwh2000 rate buckets.
 */
export function getEffectiveRate(plan: EnergyPlan, usageKwh: number): number {
  const rate500 = Number(plan.kwh500) || Number(plan.kwh1000);
  const rate1000 = Number(plan.kwh1000);
  const rate2000 = Number(plan.kwh2000) || Number(plan.kwh1000);

  if (usageKwh <= 500) {
    return rate500;
  } else if (usageKwh <= 1000) {
    // Interpolate between 500 and 1000
    const t = (usageKwh - 500) / 500;
    return rate500 + t * (rate1000 - rate500);
  } else if (usageKwh <= 2000) {
    // Interpolate between 1000 and 2000
    const t = (usageKwh - 1000) / 1000;
    return rate1000 + t * (rate2000 - rate1000);
  } else {
    return rate2000;
  }
}

/**
 * Calculate estimated monthly bill for a plan
 * Uses interpolated rate based on usage level
 */
export function calculateEstimate(
  plan: EnergyPlan,
  usageKwh: number
): number {
  return usageKwh * getEffectiveRate(plan, usageKwh);
}

/**
 * Get filtered plans from database with retailer and utility data
 */
export async function getPlans(criteria: PlanCriteria): Promise<PlansResult> {
  const usageKwh = criteria.usageKwh ?? 1000;

  // Look up utility for zipcode (always returns a code, defaults to oncor)
  const utilityCode = await getUtilityForZipcode(criteria.zipCode);

  // Get utility info from code
  const { data: utilityInfo } = await supabase
    .from("utilities")
    .select("id, code, name")
    .eq("code", utilityCode)
    .single();

  // Fetch plans with retailer and utility data via JOINs
  let query = supabase.from("plans").select(`
    *,
    retailer:retailers(id, name, puct_number, logo_url, website, phone, google_rating, google_reviews_url),
    utility:utilities(id, code, name)
  `);

  // If we couldn't determine the utility, return empty results instead of all plans
  if (!utilityInfo) {
    console.error(`No utility found for code: ${utilityCode}`);
    return {
      criteria: {
        zipCode: criteria.zipCode,
        usageKwh,
        termMonths: criteria.termMonths ?? null,
        renewableOnly: criteria.renewableOnly ?? false,
      },
      utility: undefined,
      plans: [],
    };
  }

  // Always filter by utility (never show mixed utilities)
  query = query.eq("utility_id", utilityInfo.id);

  // Apply term length filter
  if (criteria.termMonths) {
    // Exact match
    query = query.eq("term_length_months", criteria.termMonths);
  } else if (criteria.minTermMonths) {
    // Minimum term (>= filter)
    query = query.gte("term_length_months", criteria.minTermMonths);
  } else if (!criteria.retailer) {
    // Default to 12-month plans ONLY when not filtering by retailer
    query = query.eq("term_length_months", 12);
  }
  const termMonths = criteria.termMonths ?? criteria.minTermMonths ?? (criteria.retailer ? null : 12);
  if (criteria.renewableOnly) {
    query = query.eq("renewable_percent", 100);
  }

  // Order by kwh1000 rate (cheapest first) - fetch all matching plans to ensure priority retailers are included
  query = query.order("kwh1000", { ascending: true });

  // Fetch plans
  const plansResult = await query;

  if (plansResult.error) {
    console.error("Error fetching plans:", plansResult.error);
    throw new Error(`Failed to fetch plans: ${plansResult.error.message}`);
  }

  // Calculate effective rates and estimates based on user's usage level
  let plansWithEstimates: EnergyPlanWithEstimate[] = (plansResult.data || [])
    .map((plan: EnergyPlan) => ({
      ...plan,
      effectiveRate: getEffectiveRate(plan, usageKwh),
      monthlyEstimate: calculateEstimate(plan, usageKwh),
    }))
    // Sort by effective rate (interpolated based on usage)
    .sort((a, b) => a.effectiveRate - b.effectiveRate);

  // Filter by retailer if specified (case-insensitive partial match)
  if (criteria.retailer) {
    const retailerFilter = criteria.retailer.toLowerCase();
    plansWithEstimates = plansWithEstimates.filter(plan =>
      plan.retailer?.name?.toLowerCase().includes(retailerFilter)
    );
  }

  let selectedPlans: EnergyPlanWithEstimate[];

  if (criteria.retailer) {
    // When filtering by retailer, show all matching plans (up to max)
    const maxPlans = 6;
    selectedPlans = plansWithEstimates.slice(0, maxPlans);
  } else {
    // Priority retailers - always show at least 1 plan from each (if available)
    const PRIORITY_RETAILERS = ["Reliant", "TXU Energy"];

    // Separate priority retailer plans from others
    const priorityPlans: EnergyPlanWithEstimate[] = [];
    const otherPlans: EnergyPlanWithEstimate[] = [];

    for (const plan of plansWithEstimates) {
      const retailerName = plan.retailer?.name || "";
      const isPriority = PRIORITY_RETAILERS.some(pr =>
        retailerName.toLowerCase().includes(pr.toLowerCase())
      );

      if (isPriority) {
        // Only keep cheapest plan per priority retailer (first one since already sorted)
        const existing = priorityPlans.find(p =>
          p.retailer?.name === plan.retailer?.name
        );
        if (!existing) {
          priorityPlans.push(plan);
        }
      } else {
        otherPlans.push(plan);
      }
    }

    // Combine: priority plans + fill remaining slots with cheapest others
    const maxPlans = 6;
    const remainingSlots = Math.max(0, maxPlans - priorityPlans.length);
    selectedPlans = [
      ...priorityPlans,
      ...otherPlans.slice(0, remainingSlots)
    ];

    // Sort final selection by effective rate (interpolated based on usage)
    selectedPlans.sort((a, b) => a.effectiveRate - b.effectiveRate);
  }

  // Transform to frontend format
  const frontendPlans = selectedPlans.map(transformToFrontendPlan);

  return {
    criteria: {
      zipCode: criteria.zipCode,
      usageKwh,
      termMonths,
      renewableOnly: criteria.renewableOnly ?? false,
    },
    utility: utilityInfo ? { code: utilityInfo.code, name: utilityInfo.name } : undefined,
    plans: frontendPlans,
  };
}

