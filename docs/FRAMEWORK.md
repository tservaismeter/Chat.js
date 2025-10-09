# MCP Widget Framework

## Problem Statement

Building MCP servers for OpenAI Apps SDK requires extensive boilerplate:
- Manual Tool/Resource/ResourceTemplate creation
- Hardcoded asset URLs with version hashes
- Repetitive handler registration
- Session management
- Manual component discovery

**Result**: 392 lines of repetitive code for a simple server.

## Solution: Configuration over Code

Users only define:
1. `component` - component folder name
2. `title` - display name
3. `schema` - input validation
4. `handler` - business logic

Everything else is automated.

## Key Innovations

### 1. Automatic Component Discovery

**Before:**
```typescript
const targets = ["todo", "pizza-map", "pizza-list"]; // manually update
```

**After:**
```typescript
const entries = fg.sync("src/**/index.{tsx,jsx}");
const targets = entries.map(file => path.basename(path.dirname(file)));
// Auto-discovers all components
```

### 2. Auto-Sync Version & Hash

**Problem:**
- Frontend: version `5.0.16` → hash `2d2b` → `widget-2d2b.js`
- Server: version `0.1.0` → hash `6ad9` → `widget-6ad9.js` ❌

**Solution:**
```typescript
// Server reads frontend package.json
const frontendPkg = JSON.parse(readFileSync("../../package.json"));
const hash = generateAssetHash(frontendPkg.version); // Always matches
```

### 3. Convention-Based URL Generation

**Before:**
```typescript
{
  id: "pizza-map",
  htmlSrc: "http://localhost:4444/pizza-map-2d2b.js",
  cssSrc: "http://localhost:4444/pizza-map-2d2b.css",
  rootElement: "pizza-map-root"
}
```

**After:**
```typescript
{
  component: "pizza-map"
  // Auto-generates all URLs and IDs
}
```

### 4. Framework Abstraction

**Before:**
```typescript
// 300+ lines of boilerplate in server.ts
const tools: Tool[] = widgets.map(w => ({...}));
server.setRequestHandler(ListToolsRequestSchema, async () => ({tools}));
// ... repeated for all handlers
```

**After:**
```typescript
createMcpWidgetServer({ version, widgets }).start();
// Framework handles everything
```

## Architecture

```
┌─────────────────────────────────────────────┐
│ User Code (server/src/server.ts)           │
│ - Widget definitions (10 lines each)       │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ Framework (server/src/framework/)           │
│ - Auto-generates Tools/Resources           │
│ - Registers MCP handlers                   │
│ - Manages sessions                         │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ MCP SDK (@modelcontextprotocol/sdk)        │
│ - SSE transport                            │
│ - Protocol implementation                  │
└─────────────────────────────────────────────┘
```

## Data Flow

### Widget Registration

```
Widget Definition
  ↓
Read package.json version → "5.0.16"
  ↓
Generate hash → "2d2b"
  ↓
Auto-generate URLs:
  - htmlSrc: "http://localhost:4444/component-2d2b.js"
  - cssSrc: "http://localhost:4444/component-2d2b.css"
  - rootElement: "component-root"
  ↓
Create MCP resources:
  - Tool: { name, inputSchema, _meta }
  - Resource: { uri, mimeType }
  - ResourceTemplate: { uriTemplate, mimeType }
  ↓
Register handlers
```

### Tool Call Execution

```
ChatGPT → Tool Call: "my-widget" { param: "value" }
  ↓
CallTool handler
  ↓
Lookup widget by component name
  ↓
Validate args with Zod schema
  ↓
Execute user handler
  ↓
Return response + widget HTML
  ↓
ChatGPT renders in iframe
  ↓
Widget loads and displays
```

## Key Components

### `build-all.mts`
- Auto-discovers components
- Builds each component
- Generates hash from package.json
- Creates `component-{hash}.js` files

### `framework/types.ts`
- `WidgetDefinition`: User config
- `ServerConfig`: Server settings
- `WidgetMeta`: Internal processed data

### `framework/utils.ts`
- `generateAssetHash()`: Version → hash
- `zodToJsonSchema()`: Zod → JSON Schema
- `generateWidgetMeta()`: OpenAI metadata
- `generateWidgetHtml()`: Widget HTML

### `framework/widget-server.ts`
Core framework logic:
1. Read version, generate hash
2. Process widgets (auto-generate URLs)
3. Create MCP Tools/Resources
4. Register handlers
5. Start HTTP server

### `server/src/server.ts`
User configuration:
```typescript
const frontendPkg = JSON.parse(readFileSync("../../package.json"));
const widgets = [/* widget definitions */];
createMcpWidgetServer({ version: frontendPkg.version, widgets }).start();
```

## Auto-Sync Mechanism

### Hash Generation (Same algorithm on both sides)

**Build:**
```typescript
const hash = crypto.createHash("sha256")
  .update(pkg.version, "utf8")
  .digest("hex")
  .slice(0, 4);
```

**Server:**
```typescript
const version = frontendPkg.version;
const hash = crypto.createHash("sha256")
  .update(version, "utf8")
  .digest("hex")
  .slice(0, 4);
```

Result: Same version → same hash → matching filenames.

### Path Resolution

```
Execution: chatjs/server/src/server.ts
import.meta.dirname: /path/to/chatjs/server/src

../../package.json resolves to:
  ../        → chatjs/server/
  ../../     → chatjs/
  ../../package.json → chatjs/package.json ✅
```

## Design Decisions

### Why `component` over `id`?
Explicit filesystem mapping. `component: "pizza-map"` → `src/components/pizza-map/`

### Why auto-read package.json?
Single source of truth. Prevents version drift.

### Why convention-based defaults?
Reduces configuration for 90% case. Allows override when needed.

### Why framework as separate module?
Reusable. Can extract to npm package.

## Code Reduction

| Metric | Before | After | Reduction |
|--------|--------|-------|-----------|
| Lines per widget | ~65 | ~10 | 85% |
| Total server code | 392 | 131 | 67% |
| Boilerplate | 300+ | 0 | 100% |

## Future Improvements

1. **Component validation**: Check if components exist on startup
2. **Hot reload**: Watch for changes and rebuild
3. **Type generation**: Generate TypeScript from Zod
4. **NPM package**: Extract to `@org/mcp-widget-framework`
5. **CLI**: `npx create-mcp-widget my-widget`

## Comparison with OpenAI Examples

**OpenAI official example** (`pizzaz_server_node/src/server.ts`):
- 343 lines
- Manual tool/resource creation
- Hardcoded URLs
- Repeated metadata construction

**Our framework**:
- 131 lines total
- Automatic tool/resource creation
- Dynamic URLs with auto-sync
- Zero repeated code

**The framework IS the boilerplate.**

