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
import {
  getPlans,
  getEstimate,
  getAllPlanIds,
} from "./services/plan-service.js";

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
      const result = await getPlans(args);
      return {
        text: `Found ${result.plans.length} plans for ${args.zipCode}.`,
        data: result,
      };
    },
    meta: {
      invoking: "Checking Oncor and CenterPoint rate sheets…",
      invoked: "Texas energy plans ready!",
      widgetDescription:
        "Displays a ranked list of Texas retail electricity plans with pricing, contract length, and renewable status based on the user's requested ZIP, term, and usage."
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
      const result = await getPlans(args);
      return {
        text: `Found ${result.plans.length} energy plans for ZIP ${args.zipCode}.`,
        data: result,
      };
    },
    meta: {
      invoking: "Searching for plans...",
      invoked: "Plans loaded",
      widgetDescription:
        "Displays a comparison table of Texas energy plans with retailer, rate, term, renewable status, and monthly estimate."
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
      const result = await getEstimate(args.planId, args.usageKwh);

      if (!result) {
        const availablePlans = await getAllPlanIds();
        return {
          text: `Plan '${args.planId}' not found. Available plans: ${availablePlans.join(", ")}`,
          data: { error: "Plan not found", availablePlans },
        };
      }

      return {
        text: `Estimated monthly bill: $${result.estimate.toFixed(2)} for ${args.usageKwh} kWh on ${result.plan.name}.`,
        data: result,
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
