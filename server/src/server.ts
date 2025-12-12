/**
 * Energy MCP Server
 *
 * Define widgets and schemas - the framework automatically handles
 * MCP resource creation and server setup.
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

// Define widgets (component maps to src/components/{component}/)
const widgets = [
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
      const utilityNote = result.utility
        ? ` in ${result.utility.name} territory`
        : "";
      return {
        text: `Found ${result.plans.length} plans${utilityNote} for ${args.zipCode}.`,
        data: result,
      };
    },
    meta: {
      invoking: "Looking up your utility and checking rates…",
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
      const utilityNote = result.utility
        ? ` in ${result.utility.name} territory`
        : "";
      return {
        text: `Found ${result.plans.length} energy plans${utilityNote} for ZIP ${args.zipCode}.`,
        data: result,
      };
    },
    meta: {
      invoking: "Looking up your utility and searching plans…",
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

// Create and start server (framework handles everything automatically)
const server = createMcpWidgetServer({
  name: "energy-mcp-node",
  version: frontendPkg.version,  // Auto-synced with chatjs/package.json!
  widgets,
  port: Number(process.env.PORT ?? 8000),
  frontendUrl: publicOrigin ? `${publicOrigin}/assets` : undefined
});

server.start();
