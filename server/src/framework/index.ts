/**
 * MCP Widget Server Framework
 * 
 * 위젯과 스키마만 정의하면 MCP 서버를 자동으로 생성해주는 프레임워크
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

