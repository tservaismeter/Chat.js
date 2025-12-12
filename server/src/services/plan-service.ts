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
  UtilityFee,
  FrontendPlan,
} from "../types/index.js";

// Default TDU fees (fallback if utility_fees lookup fails)
const DEFAULT_TDU_FEES: UtilityFee = {
  utility_id: 0,
  fixed_monthly: 4.23,
  per_kwh: 0.056,
};

/**
 * Fetch current utility fees from database
 * Returns a map of utility_id -> fees (most recent non-expired)
 */
async function getUtilityFees(): Promise<Map<number, UtilityFee>> {
  const { data, error } = await supabase
    .from("utility_fees")
    .select("utility_id, fixed_monthly, per_kwh")
    .or("expires_at.is.null,expires_at.gt.now()")
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("Error fetching utility fees:", error);
    return new Map();
  }

  // Return map of utility_id -> most recent fees
  const feeMap = new Map<number, UtilityFee>();
  for (const fee of data || []) {
    if (!feeMap.has(fee.utility_id)) {
      feeMap.set(fee.utility_id, {
        utility_id: fee.utility_id,
        fixed_monthly: Number(fee.fixed_monthly),
        per_kwh: Number(fee.per_kwh),
      });
    }
  }
  return feeMap;
}

/**
 * Transform database plan to frontend-facing format (camelCase)
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
    energyRate: Number(plan.energy_rate) * 100, // Convert to cents/kWh for display
    renewablePercent: plan.renewable_percent,
    utility: plan.utility?.name || null,
    utilityCode: plan.utility?.code || null,
    eflUrl: plan.efl_url,
    monthlyEstimate: plan.monthlyEstimate,
  };
}

/**
 * Calculate estimated monthly bill for a plan with utility-specific TDU fees
 */
export function calculateEstimate(
  plan: EnergyPlan,
  usageKwh: number,
  tduFees: UtilityFee
): number {
  const energyCost = usageKwh * Number(plan.energy_rate);
  const tduCost = usageKwh * tduFees.per_kwh;
  const fees = Number(plan.base_fee) + tduFees.fixed_monthly;
  return energyCost + tduCost + fees;
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
    retailer:retailers(id, name, puct_number, logo_url, website, phone),
    utility:utilities(id, code, name)
  `);

  // Always filter by utility (never show mixed utilities)
  if (utilityInfo) {
    query = query.eq("utility_id", utilityInfo.id);
  }

  // Apply filters
  if (criteria.termMonths) {
    query = query.eq("term_length_months", criteria.termMonths);
  }
  if (criteria.renewableOnly) {
    query = query.eq("renewable_percent", 100);
  }

  // Fetch plans and utility fees in parallel
  const [plansResult, utilityFees] = await Promise.all([
    query,
    getUtilityFees(),
  ]);

  if (plansResult.error) {
    console.error("Error fetching plans:", plansResult.error);
    throw new Error(`Failed to fetch plans: ${plansResult.error.message}`);
  }

  // Calculate estimates using utility-specific TDU fees and sort by energy rate
  const plansWithEstimates: EnergyPlanWithEstimate[] = (plansResult.data || [])
    .map((plan: EnergyPlan) => {
      const fees = utilityFees.get(plan.utility_id ?? 0) || DEFAULT_TDU_FEES;
      return {
        ...plan,
        monthlyEstimate: calculateEstimate(plan, usageKwh, fees),
      };
    })
    .sort((a, b) => Number(a.energy_rate) - Number(b.energy_rate));

  // Transform to frontend format
  const frontendPlans = plansWithEstimates.map(transformToFrontendPlan);

  return {
    criteria: {
      zipCode: criteria.zipCode,
      usageKwh,
      termMonths: criteria.termMonths ?? null,
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
      retailer:retailers(id, name, puct_number, logo_url, website, phone),
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
 * Calculate detailed bill estimate for a specific plan with utility-specific TDU fees
 */
export async function getEstimate(
  planId: string,
  usageKwh: number
): Promise<EstimateResult | null> {
  const [plan, utilityFees] = await Promise.all([
    getPlanById(planId),
    getUtilityFees(),
  ]);

  if (!plan) {
    return null;
  }

  const fees = utilityFees.get(plan.utility_id ?? 0) || DEFAULT_TDU_FEES;

  const energyCharge = usageKwh * Number(plan.energy_rate);
  const tduDeliveryCharge = usageKwh * fees.per_kwh;
  const estimate = energyCharge + tduDeliveryCharge + Number(plan.base_fee) + fees.fixed_monthly;

  const breakdown: BillBreakdown = {
    energyCharge,
    retailerBaseFee: Number(plan.base_fee),
    tduDeliveryCharge,
    tduBaseFee: fees.fixed_monthly,
    utilityName: plan.utility?.name,
  };

  // Transform plan to frontend format and include monthlyEstimate
  const planWithEstimate: EnergyPlanWithEstimate = {
    ...plan,
    monthlyEstimate: estimate,
  };

  return {
    plan: transformToFrontendPlan(planWithEstimate),
    usageKwh,
    estimate,
    breakdown,
  };
}
