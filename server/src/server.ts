/**
 * Pizzaz MCP Server - Framework Usage Example
 * 
 * Now you only need to define widgets and schemas!
 * The framework automatically handles MCP resource creation and server setup.
 */

import { z } from "zod";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createMcpWidgetServer } from "./framework/index.js";
import { MOCK_PLANS, TDU_FEE, findPlanById, calculateEstimate } from "./data/plans.js";

// Auto-read version from frontend package.json
const frontendPkgPath = resolve(import.meta.dirname, "../../package.json");
const frontendPkg = JSON.parse(readFileSync(frontendPkgPath, "utf8"));

const publicOrigin =
  process.env.PUBLIC_ORIGIN?.replace(/\/+$/, "") || undefined;

// Step 1: Define widgets (component maps to src/components/{component}/)
const widgets = [
  {
    component: "pizzaz",  // → src/components/pizzaz/
    title: "Show Pizza Map",
    description: "Display an interactive pizza map",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention when rendering the pizza map.")
    }),
    handler: async (args: { pizzaTopping: string }) => ({
      text: "Rendered a pizza map!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing a map",
      invoked: "Served a fresh map",
      widgetDescription: "Renders an interactive map showing pizza places with markers and location details. Displays information about the selected pizza topping."
    }
  },
  {
    component: "pizzaz-carousel",  // → src/components/pizzaz-carousel/
    title: "Show Pizza Carousel",
    description: "Display a carousel of pizza places",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention when rendering the pizza carousel.")
    }),
    handler: async (args: { pizzaTopping: string }) => ({
      text: "Rendered a pizza carousel!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Carousel some spots",
      invoked: "Served a fresh carousel",
      widgetDescription: "Renders a horizontally scrollable carousel displaying pizza places with images and details. Shows multiple locations at once for easy browsing."
    }
  },
  {
    component: "pizzaz-albums",  // → src/components/pizzaz-albums/
    title: "Show Pizza Album",
    description: "Display a photo album of pizzas",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention when rendering the pizza albums.")
    }),
    handler: async (args: { pizzaTopping: string }) => ({
      text: "Rendered a pizza album!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing an album",
      invoked: "Served a fresh album"
    }
  },
  {
    component: "pizzaz-list",  // → src/components/pizzaz-list/
    title: "Show Pizza List",
    description: "Display a list of pizza places",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention when rendering the pizza list.")
    }),
    handler: async (args: { pizzaTopping: string }) => ({
      text: "Rendered a pizza list!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing a list",
      invoked: "Served a fresh list"
    }
  },
  {
    component: "energy-plans",  // → src/components/energy-plans/
    title: "Show Texas Energy Plans",
    description: "Surface competitive retail electricity offers in deregulated Texas markets",
    schema: z.object({
      zipCode: z.string().describe("Target Texas ZIP code for available plans."),
      usageKwh: z
        .number()
        .min(250)
        .max(5000)
        .optional()
        .describe("Estimated monthly usage in kWh (defaults to 1000 if not provided)."),
      termMonths: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Desired contract length in months if the user specifies it."),
      renewableOnly: z
        .boolean()
        .optional()
        .describe("Filter to 100% renewable plans when true.")
    }),
    handler: async (args: {
      zipCode: string;
      usageKwh?: number;
      termMonths?: number;
      renewableOnly?: boolean;
    }) => {
      const usageKwh = args.usageKwh ?? 1000;

      const basePlans = [
        {
          provider: "Lone Star Energy",
          planName: "Saver 12",
          rateCentsPerKwh: 11.3,
          contractLengthMonths: 12,
          cancellationFee: "$150",
          greenEnergy: false,
          summary:
            "Best for budget-minded households wanting predictable pricing for a full year.",
          perks: ["Price-protected", "Same-day start available"],
          link: "https://example.com/lone-star-saver-12"
        },
        {
          provider: "Bluebonnet Power",
          planName: "Flex Green 24",
          rateCentsPerKwh: 12.1,
          contractLengthMonths: 24,
          cancellationFee: "$200",
          greenEnergy: true,
          summary:
            "Lock in a longer term with 100% renewable mix sourced from Texas wind contracts.",
          perks: ["Renewable energy credits", "Bill credits over 1200 kWh"],
          link: "https://example.com/bluebonnet-flex-green-24"
        },
        {
          provider: "Gulf Coast Electric",
          planName: "Intro Saver 6",
          rateCentsPerKwh: 10.9,
          contractLengthMonths: 6,
          cancellationFee: "$99",
          greenEnergy: false,
          summary:
            "Short-term contract with the lowest introductory rate, ideal for renters.",
          perks: ["No base charge", "AutoPay discount"],
          link: "https://example.com/gulf-coast-intro-saver-6"
        },
        {
          provider: "Rio Grande Power",
          planName: "Sunrise 12",
          rateCentsPerKwh: 11.8,
          contractLengthMonths: 12,
          cancellationFee: "$135",
          greenEnergy: true,
          summary:
            "100% solar-backed plan with modest premium and fixed delivery charges.",
          perks: ["Smart thermostat rebate", "Monthly usage insights"],
          link: "https://example.com/rio-grande-sunrise-12"
        }
      ];

      const filteredPlans = basePlans
        .filter((plan) =>
          args.termMonths ? plan.contractLengthMonths === args.termMonths : true
        )
        .filter((plan) => (args.renewableOnly ? plan.greenEnergy : true))
        .map((plan) => {
          const deliveryFee = 3.75; // Simulated TDU base charge in dollars
          const monthlyEstimate =
            (usageKwh * plan.rateCentsPerKwh) / 100 + deliveryFee;
          return {
            ...plan,
            monthlyEstimate,
            perks: plan.perks ?? []
          };
        })
        .sort((a, b) => a.rateCentsPerKwh - b.rateCentsPerKwh);

      return {
        text: `Found ${filteredPlans.length} plans for ${args.zipCode}.`,
        data: {
          criteria: {
            zipCode: args.zipCode,
            usageKwh,
            termMonths: args.termMonths ?? null,
            renewableOnly: args.renewableOnly ?? false
          },
          plans: filteredPlans
        }
      };
    },
    meta: {
      invoking: "Checking Oncor and CenterPoint rate sheets…",
      invoked: "Texas energy plans ready!",
      widgetDescription:
        "Displays a ranked list of Texas retail electricity plans with pricing, contract length, perks, and renewable status based on the user's requested ZIP, term, and usage."
    }
  },
  {
    component: "get-plans",  // → src/components/get-plans/
    title: "Get Energy Plans",
    description: "Shows available energy plans for a Texas ZIP code in a comparison table format",
    schema: z.object({
      zipCode: z.string().describe("Texas ZIP code for available plans"),
      usageKwh: z
        .number()
        .min(250)
        .max(5000)
        .optional()
        .describe("Estimated monthly usage in kWh (defaults to 1000)"),
      termMonths: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Filter by contract length in months"),
      renewableOnly: z
        .boolean()
        .optional()
        .describe("Only show 100% renewable plans when true")
    }),
    handler: async (args: {
      zipCode: string;
      usageKwh?: number;
      termMonths?: number;
      renewableOnly?: boolean;
    }) => {
      const usageKwh = args.usageKwh ?? 1000;

      const filteredPlans = MOCK_PLANS
        .filter((plan) =>
          args.termMonths ? plan.contractLengthMonths === args.termMonths : true
        )
        .filter((plan) => (args.renewableOnly ? plan.greenEnergy : true))
        .map((plan) => ({
          ...plan,
          monthlyEstimate: calculateEstimate(usageKwh, plan.rateCentsPerKwh)
        }))
        .sort((a, b) => a.rateCentsPerKwh - b.rateCentsPerKwh);

      return {
        text: `Found ${filteredPlans.length} energy plans for ZIP ${args.zipCode}.`,
        data: {
          criteria: {
            zipCode: args.zipCode,
            usageKwh,
            termMonths: args.termMonths ?? null,
            renewableOnly: args.renewableOnly ?? false
          },
          plans: filteredPlans
        }
      };
    },
    meta: {
      invoking: "Searching for plans...",
      invoked: "Plans loaded",
      widgetDescription:
        "Displays a comparison table of Texas energy plans with provider, rate, term, green status, and monthly estimate."
    }
  },
  {
    component: "estimate-bill",  // → src/components/estimate-bill/
    title: "Estimate Bill",
    description: "Calculates estimated monthly electricity bill based on usage and selected plan",
    schema: z.object({
      planId: z.string().describe("Plan identifier (e.g., 'lonestar-saver12', 'bluebonnet-flexgreen24')"),
      usageKwh: z
        .number()
        .min(100)
        .max(10000)
        .describe("Monthly electricity usage in kWh")
    }),
    handler: async (args: { planId: string; usageKwh: number }) => {
      const plan = findPlanById(args.planId);

      if (!plan) {
        return {
          text: `Plan '${args.planId}' not found. Available plans: ${MOCK_PLANS.map(p => p.id).join(", ")}`,
          data: { error: "Plan not found", availablePlans: MOCK_PLANS.map(p => p.id) }
        };
      }

      const energyCharge = (args.usageKwh * plan.rateCentsPerKwh) / 100;
      const estimate = energyCharge + TDU_FEE;

      return {
        text: `Estimated monthly bill: $${estimate.toFixed(2)} for ${args.usageKwh} kWh on ${plan.planName}.`,
        data: {
          plan: {
            id: plan.id,
            provider: plan.provider,
            planName: plan.planName,
            rateCentsPerKwh: plan.rateCentsPerKwh,
            contractLengthMonths: plan.contractLengthMonths,
            cancellationFee: plan.cancellationFee,
            greenEnergy: plan.greenEnergy
          },
          usageKwh: args.usageKwh,
          estimate,
          breakdown: {
            energyCharge,
            tduFee: TDU_FEE
          }
        }
      };
    },
    meta: {
      invoking: "Calculating estimate...",
      invoked: "Estimate ready",
      widgetDescription:
        "Displays estimated monthly electricity bill with breakdown of energy charges and TDU fees."
    }
  }
];

// Step 2: Create and start server (framework handles everything automatically!)
// Version is auto-read from frontend package.json to ensure hash matches
const server = createMcpWidgetServer({
  name: "pizzaz-node",
  version: frontendPkg.version,  // Auto-synced with chatjs/package.json!
  widgets,
  port: Number(process.env.PORT ?? 8000),
  frontendUrl: publicOrigin ? `${publicOrigin}/assets` : undefined
});

server.start();
