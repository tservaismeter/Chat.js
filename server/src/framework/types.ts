import type { z } from "zod";

/**
 * Widget Definition Type
 * Core type used when defining widgets
 */
export type WidgetDefinition<TSchema extends z.ZodType = z.ZodType> = {
  /** Unique widget ID (used as tool name) */
  id: string;
  
  /** Widget display name */
  title: string;
  
  /** Widget description (optional) */
  description?: string;
  
  /** Widget JavaScript file URL */
  htmlSrc: string;
  
  /** Widget CSS file URL (optional) */
  cssSrc?: string;
  
  /** Root element ID where the widget will be rendered */
  rootElement: string;
  
  /** Input parameter schema (Zod schema) */
  schema: TSchema;
  
  /** Handler function to execute when widget is called */
  handler: (args: z.infer<TSchema>) => Promise<WidgetHandlerResult>;
  
  /** Additional metadata (optional) */
  meta?: {
    /** Widget loading message */
    invoking?: string;
    /** Widget load complete message */
    invoked?: string;
    /** Widget description - helps the model understand the widget's role */
    widgetDescription?: string;
  };
};

/**
 * Widget Handler Result Type
 */
export type WidgetHandlerResult = {
  /** Text response to show to the user */
  text: string;
  
  /** Structured data (optional) */
  data?: Record<string, any>;
};

/**
 * MCP Widget Server Configuration
 */
export type ServerConfig = {
  /** Server name */
  name: string;
  
  /** Server version */
  version: string;
  
  /** Widget definition array */
  widgets: WidgetDefinition[];
  
  /** HTTP server port (default: 8000) */
  port?: number;
  
  /** SSE endpoint path (default: "/mcp") */
  ssePath?: string;
  
  /** POST message endpoint path (default: "/mcp/messages") */
  postPath?: string;
};

/**
 * Widget metadata used internally
 */
export type WidgetMeta = {
  id: string;
  title: string;
  templateUri: string;
  html: string;
  definition: WidgetDefinition;
};

