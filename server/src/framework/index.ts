/**
 * MCP Widget Server Framework
 * 
 * A framework that automatically generates an MCP server from widget and schema definitions
 */

export { McpWidgetServer, createMcpWidgetServer } from "./widget-server.js";
export type { 
  WidgetDefinition, 
  WidgetHandlerResult, 
  ServerConfig 
} from "./types.js";
export { 
  zodToJsonSchema, 
  generateWidgetMeta, 
  generateWidgetHtml 
} from "./utils.js";

