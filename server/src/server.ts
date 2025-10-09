/**
 * Pizzaz MCP Server - Framework Usage Example
 * 
 * Now you only need to define widgets and schemas!
 * The framework automatically handles MCP resource creation and server setup.
 */

import { z } from "zod";
import { createMcpWidgetServer } from "./framework/index.js";

// Step 1: Just define your widgets!
const widgets = [
  {
    id: "pizza-map",
    title: "Show Pizza Map",
    description: "Display an interactive pizza map",
    htmlSrc: "http://localhost:4444/pizzaz-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-2d2b.css",
    rootElement: "pizzaz-root",
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
    id: "pizza-carousel",
    title: "Show Pizza Carousel",
    description: "Display a carousel of pizza places",
    htmlSrc: "http://localhost:4444/pizzaz-carousel-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-carousel-2d2b.css",
    rootElement: "pizzaz-carousel-root",
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
    id: "pizza-albums",
    title: "Show Pizza Album",
    description: "Display a photo album of pizzas",
    htmlSrc: "http://localhost:4444/pizzaz-albums-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-albums-2d2b.css",
    rootElement: "pizzaz-albums-root",
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
    id: "pizza-list",
    title: "Show Pizza List",
    description: "Display a list of pizza places",
    htmlSrc: "http://localhost:4444/pizzaz-list-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-list-2d2b.css",
    rootElement: "pizzaz-list-root",
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
    id: "pizza-video",
    title: "Show Pizza Video",
    description: "Display a pizza video player",
    htmlSrc: "http://localhost:4444/pizzaz-video-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-video-2d2b.css",
    rootElement: "pizzaz-video-root",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention when rendering the pizza video.")
    }),
    handler: async (args: { pizzaTopping: string }) => ({
      text: "Rendered a pizza video!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing a video",
      invoked: "Served a fresh video"
    }
  },
  {
    id: "kaka-haha",
    title: "Show Kaka Haha",
    description: "Display a simple greeting message",
    htmlSrc: "http://localhost:4444/kaka-haha-2d2b.js",
    rootElement: "kaka-haha-root",
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
    id: "wowwow",
    title: "Show Wow Wow",
    description: "Display a wow message",
    htmlSrc: "http://localhost:4444/wowwow-2d2b.js",
    rootElement: "wowwow-root",
    schema: z.object({
      intensity: z.number().optional().describe("Intensity level (not used yet)")
    }),
    handler: async (args: { intensity?: number }) => ({
      text: "Wow Wow displayed!",
      data: { intensity: args.intensity }
    }),
    meta: {
      invoking: "Preparing wow wow...",
      invoked: "Wow Wow displayed!",
      widgetDescription: "Renders a bold 'Wow Wow' message in large text on a white background."
    }
  }
];

// Step 2: Create and start the server (framework handles everything automatically!)
const server = createMcpWidgetServer({
  name: "pizzaz-node",
  version: "0.1.0",
  widgets,
  port: Number(process.env.PORT ?? 8000)
});

server.start();
