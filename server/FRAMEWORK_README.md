# MCP Widget Server Framework

A framework that automatically generates an MCP server from widget and schema definitions.

## 🚀 Features

- **Simple API**: Just define widgets and the framework automatically generates MCP resources and server
- **Type Safety**: Complete type safety using TypeScript and Zod
- **Automation**: Automatic generation of Tool, Resource, ResourceTemplate
- **Extensibility**: Very simple to add new widgets

## 📦 Structure

```
framework/
├── index.ts           # Main export file
├── types.ts           # Type definitions
├── utils.ts           # Utility functions
└── widget-server.ts   # Server class
```

## 🔧 Usage

### 1. Define Widgets

```typescript
import { z } from "zod";
import { createMcpWidgetServer } from "./framework/index.js";

const widgets = [
  {
    // Required fields
    id: "my-widget",                    // Unique widget ID
    title: "My Awesome Widget",          // Widget display name
    htmlSrc: "http://localhost:4444/widget.js",  // JS file URL
    rootElement: "widget-root",          // DOM element ID for rendering
    
    // Input schema (Zod)
    schema: z.object({
      param1: z.string().describe("First parameter"),
      param2: z.number().optional().describe("Optional second parameter")
    }),
    
    // Handler function
    handler: async (args) => ({
      text: "Widget rendered successfully!",
      data: args  // Structured data (optional)
    }),
    
    // Optional fields
    description: "A detailed description",  // Widget description
    cssSrc: "http://localhost:4444/widget.css",  // CSS file URL
    meta: {
      invoking: "Loading widget...",     // Loading message
      invoked: "Widget loaded!",          // Load complete message
      widgetDescription: "Renders an interactive UI showcasing the data returned by this tool. Helps the model understand what is being displayed to avoid redundant responses."  // Widget description for the model
    }
  }
];
```

### 2. Create and Start Server

```typescript
const server = createMcpWidgetServer({
  name: "my-widget-server",
  version: "1.0.0",
  widgets,
  port: 8000  // Optional, defaults to 8000
});

server.start();
```

That's it! 🎉

## 📝 Example: Comparison with Existing server.ts

### Before (Existing Code - 392 lines)

```typescript
// Widget type definition
type PizzazWidget = { ... };

// Widget array
const widgets: PizzazWidget[] = [ ... ];

// Create maps
const widgetsById = new Map(...);
const widgetsByUri = new Map(...);

// Schema definitions
const widgetSchemas = { ... };

// Create parsers
const pizzaInputParser = z.object({ ... });

// Create MCP types
const tools: Tool[] = widgets.map(...);
const resources: Resource[] = widgets.map(...);
const resourceTemplates: ResourceTemplate[] = widgets.map(...);

// Server creation function
function createPizzazServer(): Server {
  const server = new Server(...);
  
  // Register handlers (70+ lines)
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  
  return server;
}

// Session management
const sessions = new Map<string, SessionRecord>();

// SSE handler (27 lines)
async function handleSseRequest(...) { ... }

// POST handler (30 lines)
async function handlePostMessage(...) { ... }

// Create HTTP server (35 lines)
const httpServer = createServer(...);
httpServer.listen(...);
```

### After (Using Framework - 93 lines)

```typescript
import { z } from "zod";
import { createMcpWidgetServer } from "./framework/index.js";

// Just define widgets!
const widgets = [
  {
    id: "pizza-map",
    title: "Show Pizza Map",
    htmlSrc: "http://localhost:4444/pizzaz-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-2d2b.css",
    rootElement: "pizzaz-root",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention")
    }),
    handler: async (args) => ({
      text: "Rendered a pizza map!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing a map",
      invoked: "Served a fresh map"
    }
  }
  // ... more widgets
];

// Create and start server
const server = createMcpWidgetServer({
  name: "pizzaz-node",
  version: "0.1.0",
  widgets,
  port: 8000
});

server.start();
```

**Result: 392 lines → 93 lines (76% code reduction!) 🎯**

## 🔥 Key Improvements

1. **Removed Boilerplate**: Framework handles MCP protocol-related code
2. **Declarative API**: Everything is automatically generated from widget definitions
3. **Type Safety**: TypeScript types automatically inferred from Zod schemas
4. **Extensibility**: Adding new widgets is as simple as adding an object to the array
5. **Reusability**: Framework can be used as-is in other projects

## 🎯 Adding New Widgets

Previously required multiple modifications, but now:

```typescript
// Just add to the widgets array!
const widgets = [
  // ... existing widgets
  {
    id: "new-widget",
    title: "New Widget",
    htmlSrc: "http://localhost:4444/new-widget.js",
    rootElement: "new-widget-root",
    schema: z.object({
      param: z.string()
    }),
    handler: async (args) => ({
      text: "New widget works!"
    })
  }
];
```

## 🛠️ How the Framework Works Internally

Things the framework handles automatically:

1. **Tool Creation**: Widget definition → MCP Tool conversion
2. **Resource Creation**: Widget definition → MCP Resource conversion
3. **ResourceTemplate Creation**: Widget definition → MCP ResourceTemplate conversion
4. **HTML Generation**: rootElement, htmlSrc, cssSrc → Complete HTML
5. **Metadata Generation**: Automatic generation of OpenAI widget metadata
6. **Handler Registration**: Automatic registration of ListTools, ListResources, ReadResource, CallTool
7. **Session Management**: Automatic handling of SSE session creation/deletion
8. **HTTP Server**: Automatic setup of CORS, routing, error handling

## 🧪 Testing

Start server:
```bash
cd chatjs/server
pnpm install
pnpm start
```

Verify:
```bash
curl http://localhost:8000/mcp
```

## 📚 API Reference

### `createMcpWidgetServer(config: ServerConfig)`

Creates an MCP widget server.

**Parameters:**
- `config.name`: Server name
- `config.version`: Server version
- `config.widgets`: Widget definition array
- `config.port?`: HTTP port (default: 8000)
- `config.ssePath?`: SSE endpoint path (default: "/mcp")
- `config.postPath?`: POST endpoint path (default: "/mcp/messages")

**Returns:** `McpWidgetServer` instance

### `WidgetDefinition<TSchema>`

Widget definition type.

**Required Fields:**
- `id`: Unique widget ID
- `title`: Widget display name
- `htmlSrc`: JavaScript file URL
- `rootElement`: DOM element ID for rendering
- `schema`: Zod input schema
- `handler`: Widget call handler function

**Optional Fields:**
- `description`: Widget description
- `cssSrc`: CSS file URL
- `meta.invoking`: Loading message
- `meta.invoked`: Load complete message
- `meta.widgetDescription`: Widget description for the model (OpenAI recommended)

## 💡 Best Practices

1. **Add Descriptions to Schema**: Use `.describe()` to help AI understand
2. **Use Meaningful IDs**: Widget IDs should be clear and descriptive
3. **Error Handling**: Proper error handling in handler functions
4. **Customize Meta Messages**: Set invoking/invoked messages for better UX
5. **Write Widget Descriptions**: Write `widgetDescription` to help the model understand the widget's role and avoid redundant responses (OpenAI recommended)

## ✅ Supported OpenAI Apps SDK Features

- ✅ **MCP Server Structure**: Full support
- ✅ **Tool/Resource/ResourceTemplate**: Automatic generation
- ✅ **Metadata**: outputTemplate, invoking, invoked
- ✅ **structuredContent & content**: Full support
- ✅ **Widget Description** (`openai/widgetDescription`): Supported ✨
- ✅ **Widget Access** (`openai/widgetAccessible`): Automatic setup

## 🔮 Future Improvements

- [ ] Content Security Policy (CSP) settings
- [ ] Localization (i18n) support (`openai/locale`)
- [ ] Custom subdomain (`openai/widgetDomain`)
- [ ] Widget border settings (`openai/widgetPrefersBorder`)
- [ ] Support for more complex Zod schemas (nested objects, arrays, etc.)
- [ ] Widget dependency management
- [ ] Runtime widget addition/removal
- [ ] Widget state management
- [ ] Logging and monitoring features
- [ ] Authentication/authorization support

## 📄 License

MIT
