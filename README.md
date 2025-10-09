# [Chat.js](https://github.com/DooiLabs/Chat.js) · [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/DooiLabs/Chat.js/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/create-chatgpt-app.svg?style=flat)](https://www.npmjs.com/package/create-chatgpt-app) [![GitHub stars](https://img.shields.io/github/stars/DooiLabs/Chat.js.svg?style=social&label=Star)](https://github.com/DooiLabs/Chat.js) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/DooiLabs/Chat.js/blob/main/CONTRIBUTING.md)

The ChatGPT apps framework. Make components, define schemas - everything else is automated.

> **Note**: This project is a fork of [OpenAI's Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples), enhanced with an automated framework to reduce boilerplate and simplify widget creation.

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
From the ngrok command, You will get a public URL.

For example: `https://<custom_endpoint>.ngrok-free.app/mcp`

> 💡 **Tip**: If you used `npx create-chatgpt-app`, your project already includes 6 example widgets (pizzaz map, albums, carousel, list, solar-system, and todo) ready to try!

### 4. Testing in ChatGPT


To add these apps to ChatGPT, enable developer mode, and add your apps in **Settings > Connectors**.

Add your local public URL from ngrok(like 'https://<custom_endpoint>.ngrok-free.app/mcp') to ChatGPT in **Settings > Connectors**.

## Adding a New Widget (Component)

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

### Step 2: Add Widget Definition (Schema)

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

## Acknowledgments

This project is built upon [OpenAI's Apps SDK Examples](https://github.com/openai/openai-apps-sdk-examples), which provides the foundation for creating ChatGPT apps using the Model Context Protocol (MCP). 

**Key enhancements in Chat.js:**
- Automated MCP framework that eliminates 300+ lines of boilerplate
- Convention-based widget registration
- Automatic asset URL generation with version syncing
- Simplified API for creating widgets
- npm initializer (`create-chatgpt-app`) for instant project setup

Credits to OpenAI for the original Apps SDK implementation and example widgets.

## License

MIT
