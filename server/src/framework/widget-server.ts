import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { URL } from "node:url";
import { extname, resolve, sep } from "node:path";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type ResourceTemplate,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";

import type { ServerConfig, WidgetDefinition, WidgetMeta } from "./types.js";
import { generateAssetHash, generateWidgetHtml, generateWidgetMeta, zodToJsonSchema } from "./utils.js";

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

/**
 * MCP Widget Server Class
 * Automatically creates and runs an MCP server from widget definitions.
 */
export class McpWidgetServer {
  private config: ServerConfig;
  private sessions = new Map<string, SessionRecord>();
  private widgetMetas: WidgetMeta[];
  private assetsDir: string;

  constructor(config: ServerConfig) {
    this.config = config;
    
    // Generate asset hash from version (matches build-all.mts logic)
    const assetHash = generateAssetHash(config.version);
    const frontendUrl = config.frontendUrl ?? "http://localhost:4444";
    
    // Process widgets: auto-generate missing fields
    const processedWidgets = config.widgets.map(widget => {
      const component = widget.component;
      return {
        ...widget,
        htmlSrc: widget.htmlSrc ?? `${frontendUrl}/${component}-${assetHash}.js`,
        cssSrc: widget.cssSrc ?? `${frontendUrl}/${component}-${assetHash}.css`,
        rootElement: widget.rootElement ?? `${component}-root`
      };
    });
    
    // Pre-generate widget metadata
    this.widgetMetas = processedWidgets.map(widget => ({
      component: widget.component,
      title: widget.title,
      templateUri: `ui://widget/${widget.component}.html`,
      html: generateWidgetHtml(widget.rootElement!, widget.htmlSrc!, widget.cssSrc),
      definition: widget
    }));

    this.assetsDir = resolve(import.meta.dirname, "../../../assets");

    // Debug: log generated schemas at startup
    for (const meta of this.widgetMetas) {
      const schema = zodToJsonSchema(meta.definition.schema);
      console.log(`[MCP] Schema for ${meta.component}:`, JSON.stringify(schema, null, 2));
    }
  }

  /**
   * Convert widget definition to MCP Tool
   */
  private widgetToTool(widgetMeta: WidgetMeta): Tool {
    const widget = widgetMeta.definition;
    return {
      name: widget.component,
      description: widget.description || widget.title,
      inputSchema: zodToJsonSchema(widget.schema),
      title: widget.title,
      annotations: widget.annotations,
      _meta: generateWidgetMeta(
        widget.component,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription,
        widget.csp,
        widget.widgetDomain
      )
    };
  }

  /**
   * Convert widget definition to MCP Resource
   */
  private widgetToResource(widgetMeta: WidgetMeta): Resource {
    const widget = widgetMeta.definition;
    return {
      uri: widgetMeta.templateUri,
      name: widget.title,
      description: widget.description || `${widget.title} widget markup`,
      mimeType: "text/html+skybridge",
      _meta: generateWidgetMeta(
        widget.component,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription,
        widget.csp,
        widget.widgetDomain
      )
    };
  }

  /**
   * Convert widget definition to MCP ResourceTemplate
   */
  private widgetToResourceTemplate(widgetMeta: WidgetMeta): ResourceTemplate {
    const widget = widgetMeta.definition;
    return {
      uriTemplate: widgetMeta.templateUri,
      name: widget.title,
      description: widget.description || `${widget.title} widget markup`,
      mimeType: "text/html+skybridge",
      _meta: generateWidgetMeta(
        widget.component,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription,
        widget.csp,
        widget.widgetDomain
      )
    };
  }

  /**
   * Create MCP server instance
   */
  private createMcpServer(): Server {
    const server = new Server(
      {
        name: this.config.name,
        version: this.config.version
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    // Create Tools, Resources, ResourceTemplates
    const tools = this.widgetMetas.map(w => {
      const tool = this.widgetToTool(w);
      console.log(`[MCP] Tool schema for ${tool.name}:`, JSON.stringify(tool.inputSchema, null, 2));
      return tool;
    });
    const resources = this.widgetMetas.map(w => this.widgetToResource(w));
    const resourceTemplates = this.widgetMetas.map(w => this.widgetToResourceTemplate(w));

    // Maps for quick lookup
    const widgetsByComponent = new Map(this.widgetMetas.map(w => [w.component, w]));
    const widgetsByUri = new Map(this.widgetMetas.map(w => [w.templateUri, w]));

    // ListTools handler
    server.setRequestHandler(
      ListToolsRequestSchema,
      async (_request: ListToolsRequest) => ({
        tools
      })
    );

    // ListResources handler
    server.setRequestHandler(
      ListResourcesRequestSchema,
      async (_request: ListResourcesRequest) => ({
        resources
      })
    );

    // ReadResource handler
    server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request: ReadResourceRequest) => {
        const widgetMeta = widgetsByUri.get(request.params.uri);

        if (!widgetMeta) {
          throw new Error(`Unknown resource: ${request.params.uri}`);
        }

        const widget = widgetMeta.definition;

        return {
          contents: [
            {
              uri: widgetMeta.templateUri,
              mimeType: "text/html+skybridge",
              text: widgetMeta.html,
              _meta: generateWidgetMeta(
                widget.component,
                widget.title,
                widget.meta?.invoking,
                widget.meta?.invoked,
                widget.meta?.widgetDescription,
                widget.csp,
                widget.widgetDomain
              )
            }
          ]
        };
      }
    );

    // ListResourceTemplates handler
    server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async (_request: ListResourceTemplatesRequest) => ({
        resourceTemplates
      })
    );

    // CallTool handler
    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        console.log(`[MCP] CallTool: ${request.params.name}`, request.params.arguments);

        try {
          const widgetMeta = widgetsByComponent.get(request.params.name);

          if (!widgetMeta) {
            throw new Error(`Unknown tool: ${request.params.name}`);
          }

          const widget = widgetMeta.definition;

          // Validate and parse input using schema
          const args = widget.schema.parse(request.params.arguments ?? {});

          // Execute user-defined handler
          const result = await widget.handler(args);

          console.log(`[MCP] CallTool result:`, { text: result.text, planCount: result.data?.plans?.length });

          return {
            content: [
              {
                type: "text" as const,
                text: result.text
              }
            ],
            structuredContent: result.data,
            _meta: generateWidgetMeta(
              widget.component,
              widget.title,
              widget.meta?.invoking,
              widget.meta?.invoked,
              widget.meta?.widgetDescription,
              widget.csp,
              widget.widgetDomain
            )
          };
        } catch (error) {
          console.error(`[MCP] CallTool ERROR:`, error);
          throw error;
        }
      }
    );

    return server;
  }

  /**
   * Handle SSE request
   */
  private async handleSseRequest(res: ServerResponse) {
    const postPath = this.config.postPath ?? "/mcp/messages";
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    const server = this.createMcpServer();
    const transport = new SSEServerTransport(postPath, res);
    const sessionId = transport.sessionId;

    this.sessions.set(sessionId, { server, transport });

    transport.onclose = async () => {
      this.sessions.delete(sessionId);
      await server.close();
    };

    transport.onerror = (error) => {
      console.error("SSE transport error", error);
    };

    try {
      await server.connect(transport);
    } catch (error) {
      this.sessions.delete(sessionId);
      console.error("Failed to start SSE session", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Failed to establish SSE connection");
      }
    }
  }

  /**
   * Handle POST message
   */
  private async handlePostMessage(
    req: IncomingMessage,
    res: ServerResponse,
    url: URL
  ) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    const sessionId = url.searchParams.get("sessionId");

    if (!sessionId) {
      res.writeHead(400).end("Missing sessionId query parameter");
      return;
    }

    const session = this.sessions.get(sessionId);

    if (!session) {
      res.writeHead(404).end("Unknown session");
      return;
    }

    try {
      await session.transport.handlePostMessage(req, res);
    } catch (error) {
      console.error("Failed to process message", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Failed to process message");
      }
    }
  }

  /**
   * Start HTTP server
   */
  start() {
    const port = this.config.port ?? 8000;
    const ssePath = this.config.ssePath ?? "/mcp";
    const postPath = this.config.postPath ?? "/mcp/messages";
    const assetsDir = this.assetsDir;

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // Log ALL incoming requests
      console.log(`[HTTP] ${req.method} ${req.url}`);

      if (!req.url) {
        res.writeHead(400).end("Missing URL");
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

      // Handle CORS preflight
      if (req.method === "OPTIONS" && (url.pathname === ssePath || url.pathname === postPath)) {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type"
        });
        res.end();
        return;
      }

      // Start SSE stream
      if (req.method === "GET" && url.pathname === ssePath) {
        await this.handleSseRequest(res);
        return;
      }

      // Handle POST message
      if (req.method === "POST" && url.pathname === postPath) {
        await this.handlePostMessage(req, res, url);
        return;
      }

      if ((req.method === "GET" || req.method === "OPTIONS") && url.pathname.startsWith("/assets/")) {
        const relativePath = decodeURIComponent(url.pathname.slice("/assets/".length));
        if (!relativePath) {
          res.writeHead(404).end("Not Found");
          return;
        }

        const filePath = resolve(assetsDir, relativePath);

        if (
          (!filePath.startsWith(`${assetsDir}${sep}`) && filePath !== assetsDir) ||
          !existsSync(filePath)
        ) {
          res.writeHead(404).end("Not Found");
          return;
        }

        if (req.method === "OPTIONS") {
          res.writeHead(204, {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
            "Cross-Origin-Resource-Policy": "cross-origin",
          });
          res.end();
          return;
        }

        try {
          const stats = statSync(filePath);
          if (stats.isDirectory()) {
            res.writeHead(404).end("Not Found");
            return;
          }

          const mimeTypes: Record<string, string> = {
            ".js": "application/javascript",
            ".css": "text/css",
            ".html": "text/html",
            ".json": "application/json",
            ".map": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
          };

          const ext = extname(filePath);
          const contentType = mimeTypes[ext] ?? "application/octet-stream";
          res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
            "Cross-Origin-Resource-Policy": "cross-origin",
          });
          const stream = createReadStream(filePath);
          stream.pipe(res);
          stream.on("error", () => {
            if (!res.headersSent) {
              res.writeHead(500);
            }
            res.end();
          });
        } catch (err) {
          console.error("Failed to serve asset", err);
          if (!res.headersSent) {
            res.writeHead(500).end("Failed to read asset");
          } else {
            res.end();
          }
        }
        return;
      }

      res.writeHead(404).end("Not Found");
    });

    httpServer.on("clientError", (err: Error, socket) => {
      console.error("HTTP client error", err);
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    });

    httpServer.listen(port, () => {
      console.log(`${this.config.name} listening on http://localhost:${port}`);
      console.log(`  SSE stream: GET http://localhost:${port}${ssePath}`);
      console.log(`  Message post endpoint: POST http://localhost:${port}${postPath}?sessionId=...`);
      console.log(`  Registered ${this.config.widgets.length} widget(s):`);
      this.config.widgets.forEach(w => {
        console.log(`    - ${w.component}: ${w.title}`);
      });
    });

    return httpServer;
  }
}

/**
 * Helper function to create MCP widget server
 */
export function createMcpWidgetServer(config: ServerConfig): McpWidgetServer {
  return new McpWidgetServer(config);
}
