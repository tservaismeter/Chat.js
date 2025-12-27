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
import { getPlans } from "./services/plan-service.js";

// Auto-read version from frontend package.json
const frontendPkgPath = resolve(import.meta.dirname, "../../package.json");
const frontendPkg = JSON.parse(readFileSync(frontendPkgPath, "utf8"));

const publicOrigin =
  process.env.PUBLIC_ORIGIN?.replace(/\/+$/, "") || undefined;

// Define widgets (component maps to src/components/{component}/)
const widgets = [
  {
    component: "list-plans",  // → src/components/list-plans/
    title: "Get Energy Plans",
    description: "Use this when the user wants to find or compare electricity plans in Texas. Searches by ZIP code with optional filters for usage, contract length, renewable energy, and retailer. Do not use for other states or utility services like gas or water.",
    schema: z.object({
      zipCode: z.string().describe("Texas ZIP code for available plans"),
      usageKwh: z
        .coerce
        .number()
        .min(250)
        .max(5000)
        .optional()
        .describe("Estimated monthly usage in kWh (defaults to 1000)"),
      termMonths: z
        .coerce
        .number()
        .int()
        .positive()
        .optional()
        .describe("Exact contract length in months"),
      minTermMonths: z
        .coerce
        .number()
        .int()
        .positive()
        .optional()
        .describe("Minimum contract length in months (returns plans >= this value)"),
      renewableOnly: z
        .boolean()
        .optional()
        .describe("Only show 100% renewable plans when true"),
      retailer: z
        .string()
        .optional()
        .describe("Filter by retailer name (e.g., 'Octopus', 'TXU', 'Reliant')")
    }),
    handler: async (args: {
      zipCode: string;
      usageKwh?: number;
      termMonths?: number;
      minTermMonths?: number;
      renewableOnly?: boolean;
      retailer?: string;
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
        "Shows energy plan cards with pricing, retailer info, and sign-up links."
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false
    },
    // Only set CSP in production - local dev needs permissive defaults
    ...(!publicOrigin ? {
      csp: {
        connect_domains: ["https://mcp.meterplan.com"],
        resource_domains: ["https://mcp.meterplan.com"]
      },
      widgetDomain: "https://mcp.meterplan.com"
    } : {})
  }
];

// Create and start server (framework handles everything automatically)
const server = createMcpWidgetServer({
  name: "texas-electricity-plans",
  version: frontendPkg.version,  // Auto-synced with chatjs/package.json!
  widgets,
  port: Number(process.env.PORT ?? 8000),
  frontendUrl: publicOrigin ? `${publicOrigin}/assets` : undefined
});

server.start();
