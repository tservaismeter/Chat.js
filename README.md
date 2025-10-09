# Chat.js

The ChatGPT apps framework. Define widgets and schemas - the framework handles MCP resources, tools, and handlers automatically.

> **For AI Coding Tools**: If you're using an AI coding tool like Cursor, Claude Code, or Codex, try prompting:
> 
> _"Read the `/docs/AGENTS.md` and help me use this chatjs framework."_

## Quick Start

### 1. Create a New Project

```bash
npx create-chatgpt-app my-app
cd my-app
```

Or clone this repository to use as a starting point.

### 2. Install & Build

```bash
pnpm install
pnpm run build
```

### 3. Run (3 terminals)

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

> 💡 **Tip**: If you used `npx create-chatgpt-app`, your project already includes 6 example widgets (pizzaz map, albums, carousel, list, solar-system, and todo) ready to try!

### 4. Testing in ChatGPT

To add these apps to ChatGPT, enable developer mode, and add your apps in **Settings > Connectors**.

To add your local server without deploying it, you can use a tool like **ngrok** to expose your local server to the internet.

For example, once your MCP servers are running, you can run:

```bash
ngrok http 8000
```

You will get a public URL that you can use to add your local server to ChatGPT in **Settings > Connectors**.

For example: `https://<custom_endpoint>.ngrok-free.app/mcp`

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
