/**
 * Shared types for the energy plans domain
 */

export interface Retailer {
  id: number;
  name: string;
  puct_number: string;
  logo_url: string | null;
  website: string | null;
  phone: string | null;
}

export interface Utility {
  id: number;
  code: string;
  name: string;
}

export interface UtilityFee {
  utility_id: number;
  fixed_monthly: number;
  per_kwh: number;
}

export interface EnergyPlan {
  id: string;
  name: string;
  signup_url: string;
  etf: number | null;
  term_length_months: number;
  base_fee: number;
  energy_rate: number;
  renewable_percent: number;
  utility_id: number | null;
  retailer_id: number | null;
  efl_url: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined data from Supabase
  retailer?: Retailer;
  utility?: Utility;
}

export interface EnergyPlanWithEstimate extends EnergyPlan {
  monthlyEstimate: number;
}

// Frontend-facing type (camelCase for React components)
export interface FrontendPlan {
  id: string;
  name: string;
  retailer: string;
  retailerLogo: string | null;
  retailerWebsite: string | null;
  signupUrl: string;
  etf: number | null;
  termLengthMonths: number;
  baseFee: number;
  energyRate: number; // in cents/kWh
  renewablePercent: number;
  utility: string | null;
  utilityCode: string | null;
  eflUrl: string | null;
  monthlyEstimate: number;
}

export interface PlanCriteria {
  zipCode: string;
  usageKwh?: number;
  termMonths?: number;
  renewableOnly?: boolean;
}

export interface PlansResult {
  criteria: {
    zipCode: string;
    usageKwh: number;
    termMonths: number | null;
    renewableOnly: boolean;
  };
  plans: FrontendPlan[];
}

export interface BillBreakdown {
  energyCharge: number;
  retailerBaseFee: number;
  tduDeliveryCharge: number;
  tduBaseFee: number;
  utilityName?: string;
}

export interface EstimateResult {
  plan: FrontendPlan;
  usageKwh: number;
  estimate: number;
  breakdown: BillBreakdown;
}
