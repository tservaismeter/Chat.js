/**
 * Shared mock energy plan data for get-plans and estimate-bill widgets
 */

export interface EnergyPlan {
  id: string;
  name: string;                  // Plan name (e.g., "Saver 12")
  retailer: string;              // Retail provider (e.g., "Lone Star Energy")
  signupUrl: string;             // Enrollment URL
  etf: number | null;            // Early termination fee in $ (null = no ETF)
  termLengthMonths: number;      // Contract length in months
  baseFee: number;               // Retailer monthly base fee in $
  energyRate: number;            // Energy rate in cents/kWh
  renewablePercent: number;      // Renewable offset 0-100
}

// TDU charges are the same regardless of retailer (set by utility like Oncor, CenterPoint)
export const TDU_BASE_FEE = 3.75;        // Monthly TDU base charge in $
export const TDU_DELIVERY_RATE = 2.8;    // TDU delivery rate in cents/kWh

export const MOCK_PLANS: EnergyPlan[] = [
  {
    id: "lonestar-saver12",
    name: "Saver 12",
    retailer: "Lone Star Energy",
    signupUrl: "https://example.com/lone-star-saver-12",
    etf: 150,
    termLengthMonths: 12,
    baseFee: 4.95,
    energyRate: 8.5,
    renewablePercent: 0
  },
  {
    id: "bluebonnet-flexgreen24",
    name: "Flex Green 24",
    retailer: "Bluebonnet Power",
    signupUrl: "https://example.com/bluebonnet-flex-green-24",
    etf: 200,
    termLengthMonths: 24,
    baseFee: 5.95,
    energyRate: 9.2,
    renewablePercent: 100
  },
  {
    id: "gulfcoast-introsaver6",
    name: "Intro Saver 6",
    retailer: "Gulf Coast Electric",
    signupUrl: "https://example.com/gulf-coast-intro-saver-6",
    etf: 99,
    termLengthMonths: 6,
    baseFee: 0,
    energyRate: 8.1,
    renewablePercent: 0
  },
  {
    id: "riogrande-sunrise12",
    name: "Sunrise 12",
    retailer: "Rio Grande Power",
    signupUrl: "https://example.com/rio-grande-sunrise-12",
    etf: 135,
    termLengthMonths: 12,
    baseFee: 4.50,
    energyRate: 8.9,
    renewablePercent: 100
  },
  {
    id: "texaswind-breeze18",
    name: "Breeze 18",
    retailer: "Texas Wind Co",
    signupUrl: "https://example.com/texas-wind-breeze-18",
    etf: 175,
    termLengthMonths: 18,
    baseFee: 4.95,
    energyRate: 8.6,
    renewablePercent: 100
  },
  {
    id: "alamo-value12",
    name: "Value 12",
    retailer: "Alamo Power",
    signupUrl: "https://example.com/alamo-value-12",
    etf: 125,
    termLengthMonths: 12,
    baseFee: 3.95,
    energyRate: 7.8,
    renewablePercent: 0
  }
];

/**
 * Calculate estimated monthly bill
 */
export function calculateEstimate(plan: EnergyPlan, usageKwh: number): number {
  const energyCost = usageKwh * (plan.energyRate + TDU_DELIVERY_RATE) / 100;
  const fees = plan.baseFee + TDU_BASE_FEE;
  return energyCost + fees;
}

/**
 * Find a plan by ID
 */
export function findPlanById(planId: string): EnergyPlan | undefined {
  return MOCK_PLANS.find(plan => plan.id === planId);
}
