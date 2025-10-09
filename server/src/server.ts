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

// Auto-read version from frontend package.json
const frontendPkgPath = resolve(import.meta.dirname, "../../package.json");
const frontendPkg = JSON.parse(readFileSync(frontendPkgPath, "utf8"));

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
    component: "kaka-haha",  // → src/components/kaka-haha/
    title: "Show Kaka Haha",
    description: "Display a simple greeting message",
    schema: z.object({
      message: z.string().optional().describe("Optional message to display (not used yet)")
    }),
    handler: async (args: { message?: string }) => ({
      text: "Displayed kaka haha message!",
      data: { message: args.message }
    }),
    meta: {
      invoking: "Preparing kaka haha...",
      invoked: "Kaka haha displayed!",
      widgetDescription: "Renders a simple greeting message 'kaka haha!' in large bold text on a white background."
    }
  },
  {
    component: "hoho-haha",  // → src/components/hoho-haha/
    title: "Show Hoho Haha",
    description: "Display the hoho haha component",
    schema: z.object({
      message: z.string().optional().describe("Optional message to display")
    }),
    handler: async (args: { message?: string }) => ({
      text: "Hoho haha component rendered!",
      data: { message: args.message }
    }),
    meta: {
      invoking: "Loading hoho haha...",
      invoked: "Hoho haha displayed!",
      widgetDescription: "Renders a beautiful gradient component with the hoho haha title and emoji. Perfect for testing and demonstration purposes."
    }
  }
];

// Step 2: Create and start server (framework handles everything automatically!)
// Version is auto-read from frontend package.json to ensure hash matches
const server = createMcpWidgetServer({
  name: "pizzaz-node",
  version: frontendPkg.version,  // Auto-synced with chatjs/package.json!
  widgets,
  port: Number(process.env.PORT ?? 8000)
});

server.start();
