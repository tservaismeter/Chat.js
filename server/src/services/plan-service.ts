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
  EstimateResult,
  BillBreakdown,
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

  // Apply filters - default to 12 month plans unless specified
  const termMonths = criteria.termMonths ?? 12;
  query = query.eq("term_length_months", termMonths);
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
  const plansWithEstimates: EnergyPlanWithEstimate[] = (plansResult.data || [])
    .map((plan: EnergyPlan) => ({
      ...plan,
      effectiveRate: getEffectiveRate(plan, usageKwh),
      monthlyEstimate: calculateEstimate(plan, usageKwh),
    }))
    // Sort by effective rate (interpolated based on usage)
    .sort((a, b) => a.effectiveRate - b.effectiveRate);

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
  const selectedPlans = [
    ...priorityPlans,
    ...otherPlans.slice(0, remainingSlots)
  ];

  // Sort final selection by effective rate (interpolated based on usage)
  selectedPlans.sort((a, b) => a.effectiveRate - b.effectiveRate);

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

/**
 * Get a single plan by ID with retailer and utility data
 */
export async function getPlanById(
  planId: string
): Promise<EnergyPlan | null> {
  const { data: plan, error } = await supabase
    .from("plans")
    .select(`
      *,
      retailer:retailers(id, name, puct_number, logo_url, website, phone, google_rating, google_reviews_url),
      utility:utilities(id, code, name)
    `)
    .eq("id", planId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("Error fetching plan:", error);
    throw new Error(`Failed to fetch plan: ${error.message}`);
  }

  return plan;
}

/**
 * Get all plan IDs (for error messages)
 */
export async function getAllPlanIds(): Promise<string[]> {
  const { data: plans, error } = await supabase.from("plans").select("id");

  if (error) {
    console.error("Error fetching plan IDs:", error);
    return [];
  }

  return (plans || []).map((p) => p.id);
}

/**
 * Calculate detailed bill estimate for a specific plan
 * Uses interpolated rate based on usage level
 */
export async function getEstimate(
  planId: string,
  usageKwh: number
): Promise<EstimateResult | null> {
  const plan = await getPlanById(planId);

  if (!plan) {
    return null;
  }

  const effectiveRate = getEffectiveRate(plan, usageKwh);
  const estimate = usageKwh * effectiveRate;

  // Breakdown is simplified since rate is all-in
  const breakdown: BillBreakdown = {
    energyCharge: estimate,
    retailerBaseFee: 0,
    tduDeliveryCharge: 0,
    tduBaseFee: 0,
    utilityName: plan.utility?.name,
  };

  // Transform plan to frontend format and include monthlyEstimate
  const planWithEstimate: EnergyPlanWithEstimate = {
    ...plan,
    effectiveRate,
    monthlyEstimate: estimate,
  };

  return {
    plan: transformToFrontendPlan(planWithEstimate),
    usageKwh,
    estimate,
    breakdown,
  };
}
