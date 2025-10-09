# MCP Widget Framework

A framework for building OpenAI MCP servers. Define widgets and schemas - the framework handles MCP resources, tools, and handlers automatically.

> **For AI Coding Tools**: If you're using an AI coding tool like Cursor, Claude Code, or Codex, try prompting:
> 
> _"Read the `/docs/AGENTS.md` and help me use this chatjs framework."_

## Quick Start

### 1. Install & Build

```bash
pnpm install
pnpm run build
```

### 2. Run (3 terminals)

**Terminal 1** - Frontend assets server:
```bash
pnpm run serve
```

**Terminal 2** - MCP server:
```bash
cd server
pnpm start
```

**Terminal 3** - Expose to internet:
```bash
ngrok http 8000
```

Use the ngrok URL to connect to ChatGPT.

## Adding a New Widget

### Step 1: Create Component

Create `src/components/my-widget/index.jsx`:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';

function MyWidget() {
  return <div>My Widget Content</div>;
}

const rootElement = document.getElementById('my-widget-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<MyWidget />);
}
```

### Step 2: Add Widget Definition

Edit `server/src/server.ts`:

```typescript
const widgets = [
  // ... existing widgets
  {
    component: "my-widget",  // matches folder name
    title: "My Widget",
    schema: z.object({
      param: z.string().describe("Parameter description")
    }),
    handler: async (args) => ({
      text: "Widget rendered!",
      data: args
    })
  }
];
```

### Step 3: Rebuild & Restart

```bash
# Terminal 1: Rebuild
pnpm run build

# Terminal 2: Restart server
cd server
pnpm start
```

Done.

## How It Works

- `component: "my-widget"` maps to `src/components/my-widget/`
- Build script auto-discovers all components
- Server auto-syncs version from `package.json` for asset hashing
- Framework auto-generates MCP tools, resources, and handlers

## Troubleshooting

**404 on widget assets:**
```bash
pnpm run build      # Rebuild
cd server && pnpm start  # Restart server
```

**Component not found:**
- Check `src/components/your-widget/index.jsx` exists
- Check widget definition in `server/src/server.ts`

## Project Structure

```
chatjs/
├── src/components/          # React components (add here)
│   └── my-widget/
│       └── index.jsx
├── assets/                  # Built assets (generated)
├── server/src/
│   ├── framework/           # MCP framework
│   └── server.ts           # Widget definitions (edit here)
└── package.json            # Version (auto-synced)
```

## API

### Widget Definition

```typescript
{
  component: string;              // Component folder name (required)
  title: string;                  // Display name (required)
  description?: string;
  schema: ZodType;                // Input schema (required)
  handler: (args) => Promise<{   // Handler (required)
    text: string;
    data?: Record<string, any>;
  }>;
  meta?: {
    invoking?: string;            // "Loading..."
    invoked?: string;             // "Loaded!"
    widgetDescription?: string;   // For AI model understanding
  };
}
```

## License

MIT
