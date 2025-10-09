# Guide for AI Coding Agents

This guide helps AI coding agents (Cursor, Claude Code, Codex, etc.) understand how to work with the MCP Widget Framework.

## Framework Overview

This is an MCP (Model Context Protocol) Widget Framework that simplifies building OpenAI apps in ChatGPT. Users only define components and minimal configuration - the framework handles all MCP boilerplate automatically.

## Task 1: Creating a New Component

When a user asks to create a new widget/component:

### Step 1: Create Component File

Create `src/components/{component-name}/index.jsx`:

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';

function MyComponent() {
  // Component implementation here
  return (
    <div style={{ padding: '2rem' }}>
      <h1>My Component</h1>
      {/* Add your UI here */}
    </div>
  );
}

// Mount component (standard pattern - always include this)
const rootElement = document.getElementById('{component-name}-root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<MyComponent />);
}
```

**Important conventions:**
- File must be at `src/components/{component-name}/index.jsx`
- Root element ID must match: `{component-name}-root`
- Always use `createRoot` from `react-dom/client`

### Step 2: Add Widget Definition

Edit `server/src/server.ts` and add to the `widgets` array:

```typescript
{
  component: "component-name",  // Must match folder name in src/components/
  title: "Display Name",
  description: "What this widget does",
  schema: z.object({
    // Define input parameters with Zod
    param1: z.string().describe("Parameter description"),
    param2: z.number().optional().describe("Optional parameter")
  }),
  handler: async (args: { param1: string; param2?: number }) => ({
    text: "Response text shown to user",
    data: args  // Data passed to component
  }),
  meta: {
    invoking: "Loading message...",
    invoked: "Success message!",
    widgetDescription: "Describe what the widget displays to help the model understand"
  }
}
```

**Key points:**
- `component`: Must match the folder name exactly
- `schema`: Use Zod validation
- `handler`: Returns `{ text, data }` - data is passed to component
- `meta.widgetDescription`: Helps model avoid redundant responses

### Step 3: Build & Restart

```bash
# Build the component
pnpm run build

# Restart MCP server
cd server
pnpm start
```

## Task 2: Making Component Interactive

### Accessing Data from Tool Call

Components receive data via `window.openai.toolOutput`:

```jsx
function MyComponent() {
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    // Data from handler's returned data
    if (window.openai?.toolOutput) {
      setData(window.openai.toolOutput);
    }
  }, []);

  return (
    <div>
      <h1>Param: {data?.param1}</h1>
      <p>Value: {data?.param2}</p>
    </div>
  );
}
```

### Using Props

If components use props, check existing examples:
- `src/components/pizzaz/index.jsx` - Map component
- `src/components/pizzaz-albums/index.jsx` - Album viewer
- `src/components/pizzaz-list/index.jsx` - List component

## Task 3: Understanding the Framework

### What's Automated

The framework automatically:
1. Generates asset URLs: `http://localhost:4444/{component}-{hash}.js`
2. Creates MCP Tools with correct metadata
3. Creates MCP Resources with HTML templates
4. Registers all MCP handlers
5. Syncs version between build and server
6. Validates inputs with Zod schemas

### What You Define

You only define:
1. **Component**: React component in `src/components/`
2. **Widget config**: In `server/src/server.ts`
   - `component` name
   - `title` and `description`
   - `schema` for inputs
   - `handler` for business logic

### File Mapping

```
component: "my-widget"
  ↓
src/components/my-widget/index.jsx    (you create)
  ↓ pnpm run build
  ↓
assets/my-widget-2d2b.js              (auto-generated)
  ↓
Server auto-generates URL:
http://localhost:4444/my-widget-2d2b.js
```

## Common Patterns

### Simple Static Widget

```jsx
// src/components/hello/index.jsx
function Hello() {
  return <div>Hello World!</div>;
}

const rootElement = document.getElementById('hello-root');
if (rootElement) {
  createRoot(rootElement).render(<Hello />);
}
```

```typescript
// server/src/server.ts
{
  component: "hello",
  title: "Show Hello",
  schema: z.object({}),  // No parameters
  handler: async () => ({ text: "Showing hello!" })
}
```

### Dynamic Widget with Parameters

```jsx
// src/components/greeting/index.jsx
function Greeting() {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (window.openai?.toolOutput?.name) {
      setName(window.openai.toolOutput.name);
    }
  }, []);

  return <div>Hello, {name}!</div>;
}

const rootElement = document.getElementById('greeting-root');
if (rootElement) {
  createRoot(rootElement).render(<Greeting />);
}
```

```typescript
// server/src/server.ts
{
  component: "greeting",
  title: "Show Greeting",
  schema: z.object({
    name: z.string().describe("Name to greet")
  }),
  handler: async (args: { name: string }) => ({
    text: `Greeting ${args.name}!`,
    data: { name: args.name }  // Passed to component
  })
}
```

### Widget with Multiple Parameters

```typescript
{
  component: "user-profile",
  title: "Show User Profile",
  schema: z.object({
    userId: z.string().describe("User ID"),
    showDetails: z.boolean().optional().describe("Show detailed view")
  }),
  handler: async (args: { userId: string; showDetails?: boolean }) => {
    // Fetch user data
    const user = await fetchUser(args.userId);
    
    return {
      text: `Showing profile for ${user.name}`,
      data: {
        user,
        showDetails: args.showDetails ?? false
      }
    };
  }
}
```

## Debugging

### Component Not Rendering

Check:
1. Component file exists at `src/components/{component-name}/index.jsx`
2. Root element ID matches: `{component-name}-root`
3. Built successfully: Check `assets/{component-name}-2d2b.js` exists
4. Server restarted after adding widget definition

### 404 on Assets

Fix:
```bash
pnpm run build           # Rebuild
cd server && pnpm start  # Restart
```

### Schema Validation Errors

- Ensure `schema` matches `handler` parameter types
- Use `.describe()` for all parameters
- Mark optional fields with `.optional()`

## Best Practices

1. **Component naming**: Use kebab-case (`my-widget`, not `MyWidget`)
2. **Root element**: Always use `{component-name}-root` pattern
3. **Schema descriptions**: Be specific - helps ChatGPT understand parameters
4. **Widget descriptions**: Describe what UI shows - prevents model redundancy
5. **Handler response**: Return meaningful text and relevant data

## Checklist for Adding Widget

- [ ] Create `src/components/{name}/index.jsx`
- [ ] Implement component with proper root element
- [ ] Add widget definition to `server/src/server.ts`
- [ ] Match `component` name with folder name
- [ ] Define Zod schema with descriptions
- [ ] Implement handler function
- [ ] Add `meta.widgetDescription`
- [ ] Run `pnpm run build`
- [ ] Restart server with `cd server && pnpm start`
- [ ] Test in ChatGPT

## Example Session

**User**: "Create a weather widget that shows temperature"

**Agent steps**:

1. Create `src/components/weather/index.jsx`:
```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';

function Weather() {
  const [temp, setTemp] = React.useState(null);

  React.useEffect(() => {
    if (window.openai?.toolOutput?.temperature) {
      setTemp(window.openai.toolOutput.temperature);
    }
  }, []);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem' }}>{temp}°F</h1>
      <p>Current Temperature</p>
    </div>
  );
}

const rootElement = document.getElementById('weather-root');
if (rootElement) {
  createRoot(rootElement).render(<Weather />);
}
```

2. Add to `server/src/server.ts`:
```typescript
{
  component: "weather",
  title: "Show Weather",
  schema: z.object({
    temperature: z.number().describe("Temperature in Fahrenheit")
  }),
  handler: async (args: { temperature: number }) => ({
    text: `Current temperature: ${args.temperature}°F`,
    data: { temperature: args.temperature }
  }),
  meta: {
    widgetDescription: "Displays current temperature in large text"
  }
}
```

3. Build and restart:
```bash
pnpm run build
cd server && pnpm start
```

Done!

