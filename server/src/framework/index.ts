/**
 * MCP Widget Server Framework
 * 
 * Framework that automatically generates MCP server from widget and schema definitions
 */

export { McpWidgetServer, createMcpWidgetServer } from "./widget-server.js";
export type { 
  WidgetDefinition, 
  WidgetHandlerResult, 
  ServerConfig,
  HealthSnapshot,
  HealthStatus
} from "./types.js";
export { 
  zodToJsonSchema, 
  generateWidgetMeta, 
  generateWidgetHtml,
  generateAssetHash
} from "./utils.js";
