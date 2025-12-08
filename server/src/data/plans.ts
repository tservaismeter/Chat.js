/**
 * Shared mock energy plan data for get-plans and estimate-bill widgets
 */

export interface EnergyPlan {
  id: string;
  provider: string;
  planName: string;
  rateCentsPerKwh: number;
  contractLengthMonths: number;
  cancellationFee: string;
  greenEnergy: boolean;
  summary: string;
  perks: string[];
  link: string;
}

export const TDU_FEE = 3.75; // Monthly TDU delivery charge in dollars

export const MOCK_PLANS: EnergyPlan[] = [
  {
    id: "lonestar-saver12",
    provider: "Lone Star Energy",
    planName: "Saver 12",
    rateCentsPerKwh: 11.3,
    contractLengthMonths: 12,
    cancellationFee: "$150",
    greenEnergy: false,
    summary: "Best for budget-minded households wanting predictable pricing for a full year.",
    perks: ["Price-protected", "Same-day start available"],
    link: "https://example.com/lone-star-saver-12"
  },
  {
    id: "bluebonnet-flexgreen24",
    provider: "Bluebonnet Power",
    planName: "Flex Green 24",
    rateCentsPerKwh: 12.1,
    contractLengthMonths: 24,
    cancellationFee: "$200",
    greenEnergy: true,
    summary: "Lock in a longer term with 100% renewable mix sourced from Texas wind contracts.",
    perks: ["Renewable energy credits", "Bill credits over 1200 kWh"],
    link: "https://example.com/bluebonnet-flex-green-24"
  },
  {
    id: "gulfcoast-introsaver6",
    provider: "Gulf Coast Electric",
    planName: "Intro Saver 6",
    rateCentsPerKwh: 10.9,
    contractLengthMonths: 6,
    cancellationFee: "$99",
    greenEnergy: false,
    summary: "Short-term contract with the lowest introductory rate, ideal for renters.",
    perks: ["No base charge", "AutoPay discount"],
    link: "https://example.com/gulf-coast-intro-saver-6"
  },
  {
    id: "riogrande-sunrise12",
    provider: "Rio Grande Power",
    planName: "Sunrise 12",
    rateCentsPerKwh: 11.8,
    contractLengthMonths: 12,
    cancellationFee: "$135",
    greenEnergy: true,
    summary: "100% solar-backed plan with modest premium and fixed delivery charges.",
    perks: ["Smart thermostat rebate", "Monthly usage insights"],
    link: "https://example.com/rio-grande-sunrise-12"
  },
  {
    id: "texaswind-breeze18",
    provider: "Texas Wind Co",
    planName: "Breeze 18",
    rateCentsPerKwh: 11.5,
    contractLengthMonths: 18,
    cancellationFee: "$175",
    greenEnergy: true,
    summary: "Mid-length commitment with competitive rates backed by West Texas wind farms.",
    perks: ["Free weekends", "No deposit required"],
    link: "https://example.com/texas-wind-breeze-18"
  },
  {
    id: "alamo-value12",
    provider: "Alamo Power",
    planName: "Value 12",
    rateCentsPerKwh: 10.5,
    contractLengthMonths: 12,
    cancellationFee: "$125",
    greenEnergy: false,
    summary: "Our lowest fixed rate for standard 12-month service in most areas.",
    perks: ["Paperless billing credit", "Refer-a-friend bonus"],
    link: "https://example.com/alamo-value-12"
  }
];

/**
 * Calculate estimated monthly bill
 */
export function calculateEstimate(usageKwh: number, rateCentsPerKwh: number): number {
  return (usageKwh * rateCentsPerKwh) / 100 + TDU_FEE;
}

/**
 * Find a plan by ID
 */
export function findPlanById(planId: string): EnergyPlan | undefined {
  return MOCK_PLANS.find(plan => plan.id === planId);
}
