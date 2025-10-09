import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { URL } from "node:url";

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
import { generateWidgetHtml, generateWidgetMeta, zodToJsonSchema } from "./utils.js";

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

/**
 * MCP 위젯 서버 클래스
 * 위젯 정의를 받아서 자동으로 MCP 서버를 생성하고 실행합니다.
 */
export class McpWidgetServer {
  private config: ServerConfig;
  private sessions = new Map<string, SessionRecord>();
  private widgetMetas: WidgetMeta[];

  constructor(config: ServerConfig) {
    this.config = config;
    
    // 위젯 메타데이터 사전 생성
    this.widgetMetas = config.widgets.map(widget => ({
      id: widget.id,
      title: widget.title,
      templateUri: `ui://widget/${widget.id}.html`,
      html: generateWidgetHtml(widget.rootElement, widget.htmlSrc, widget.cssSrc),
      definition: widget
    }));
  }

  /**
   * 위젯 정의를 MCP Tool로 변환
   */
  private widgetToTool(widgetMeta: WidgetMeta): Tool {
    const widget = widgetMeta.definition;
    return {
      name: widget.id,
      description: widget.description || widget.title,
      inputSchema: zodToJsonSchema(widget.schema),
      title: widget.title,
      _meta: generateWidgetMeta(
        widget.id,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription
      )
    };
  }

  /**
   * 위젯 정의를 MCP Resource로 변환
   */
  private widgetToResource(widgetMeta: WidgetMeta): Resource {
    const widget = widgetMeta.definition;
    return {
      uri: widgetMeta.templateUri,
      name: widget.title,
      description: widget.description || `${widget.title} widget markup`,
      mimeType: "text/html+skybridge",
      _meta: generateWidgetMeta(
        widget.id,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription
      )
    };
  }

  /**
   * 위젯 정의를 MCP ResourceTemplate으로 변환
   */
  private widgetToResourceTemplate(widgetMeta: WidgetMeta): ResourceTemplate {
    const widget = widgetMeta.definition;
    return {
      uriTemplate: widgetMeta.templateUri,
      name: widget.title,
      description: widget.description || `${widget.title} widget markup`,
      mimeType: "text/html+skybridge",
      _meta: generateWidgetMeta(
        widget.id,
        widget.title,
        widget.meta?.invoking,
        widget.meta?.invoked,
        widget.meta?.widgetDescription
      )
    };
  }

  /**
   * MCP 서버 인스턴스 생성
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

    // Tools, Resources, ResourceTemplates 생성
    const tools = this.widgetMetas.map(w => this.widgetToTool(w));
    const resources = this.widgetMetas.map(w => this.widgetToResource(w));
    const resourceTemplates = this.widgetMetas.map(w => this.widgetToResourceTemplate(w));

    // 빠른 조회를 위한 Map
    const widgetsById = new Map(this.widgetMetas.map(w => [w.id, w]));
    const widgetsByUri = new Map(this.widgetMetas.map(w => [w.templateUri, w]));

    // ListTools 핸들러
    server.setRequestHandler(
      ListToolsRequestSchema,
      async (_request: ListToolsRequest) => ({
        tools
      })
    );

    // ListResources 핸들러
    server.setRequestHandler(
      ListResourcesRequestSchema,
      async (_request: ListResourcesRequest) => ({
        resources
      })
    );

    // ReadResource 핸들러
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
                widget.id,
                widget.title,
                widget.meta?.invoking,
                widget.meta?.invoked,
                widget.meta?.widgetDescription
              )
            }
          ]
        };
      }
    );

    // ListResourceTemplates 핸들러
    server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      async (_request: ListResourceTemplatesRequest) => ({
        resourceTemplates
      })
    );

    // CallTool 핸들러
    server.setRequestHandler(
      CallToolRequestSchema,
      async (request: CallToolRequest) => {
        const widgetMeta = widgetsById.get(request.params.name);

        if (!widgetMeta) {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }

        const widget = widgetMeta.definition;

        // 스키마를 사용하여 입력 검증 및 파싱
        const args = widget.schema.parse(request.params.arguments ?? {});

        // 사용자 정의 핸들러 실행
        const result = await widget.handler(args);

        return {
          content: [
            {
              type: "text" as const,
              text: result.text
            }
          ],
          structuredContent: result.data,
          _meta: generateWidgetMeta(
            widget.id,
            widget.title,
            widget.meta?.invoking,
            widget.meta?.invoked,
            widget.meta?.widgetDescription
          )
        };
      }
    );

    return server;
  }

  /**
   * SSE 요청 처리
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
   * POST 메시지 처리
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
   * HTTP 서버 시작
   */
  start() {
    const port = this.config.port ?? 8000;
    const ssePath = this.config.ssePath ?? "/mcp";
    const postPath = this.config.postPath ?? "/mcp/messages";

    const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      if (!req.url) {
        res.writeHead(400).end("Missing URL");
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

      // CORS preflight 처리
      if (req.method === "OPTIONS" && (url.pathname === ssePath || url.pathname === postPath)) {
        res.writeHead(204, {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type"
        });
        res.end();
        return;
      }

      // SSE 스트림 시작
      if (req.method === "GET" && url.pathname === ssePath) {
        await this.handleSseRequest(res);
        return;
      }

      // POST 메시지 처리
      if (req.method === "POST" && url.pathname === postPath) {
        await this.handlePostMessage(req, res, url);
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
        console.log(`    - ${w.id}: ${w.title}`);
      });
    });

    return httpServer;
  }
}

/**
 * MCP 위젯 서버 생성 헬퍼 함수
 */
export function createMcpWidgetServer(config: ServerConfig): McpWidgetServer {
  return new McpWidgetServer(config);
}

