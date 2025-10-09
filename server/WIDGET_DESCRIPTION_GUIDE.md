# Widget Description Guide

## 📖 Overview

`widgetDescription` is metadata in the OpenAI Apps SDK that helps **the model understand the rendered widget**. This allows the model to avoid redundantly explaining information already shown to the user and maintain more natural conversations.

## 🎯 Why is it needed?

### Before (without widgetDescription)
```
User: Show me pizza places
Assistant: Here's a map of pizza places! 🗺️

Let me list them for you:
1. Joe's Pizza - Located at 123 Main St
2. Tony's Pizzeria - Located at 456 Oak Ave
3. Mario's Pizza - Located at 789 Elm St
...
```
❌ **Problem**: The map already shows all information, but it's repeated in text

### After (with widgetDescription)
```
User: Show me pizza places
Assistant: Here's a map of pizza places! 🗺️

You can click on the markers to see details about each location.
```
✅ **Improvement**: The model understands what the widget shows and only provides simple guidance

## 📝 How to Write

### 1. Good widgetDescription

```typescript
{
  id: "pizza-map",
  title: "Show Pizza Map",
  meta: {
    widgetDescription: "Renders an interactive map showing pizza places with markers and location details. Displays information about the selected pizza topping."
  }
}
```

**Characteristics**:
- ✅ Clearly explains **what the widget shows**
- ✅ Specifically describes **what data is displayed**
- ✅ Specifies **information the user can see**

### 2. Bad widgetDescription

```typescript
// ❌ Too short
widgetDescription: "Shows a map"

// ❌ Tries to control model behavior
widgetDescription: "Displays a map. Don't list the locations again."

// ❌ Information unrelated to the widget
widgetDescription: "This is a great pizza finder tool built with React."
```

## 📋 Templates

### Map Widget
```typescript
widgetDescription: "Renders an interactive map displaying [data type] with [displayed information]. Users can interact with markers to see [detailed information]."
```

**Example**:
```typescript
widgetDescription: "Renders an interactive map displaying restaurant locations with names, ratings, and addresses. Users can interact with markers to see detailed information about each restaurant."
```

### Carousel Widget
```typescript
widgetDescription: "Displays a horizontally scrollable carousel showing [data type] with [display items]. Each item shows [information list]."
```

**Example**:
```typescript
widgetDescription: "Displays a horizontally scrollable carousel showing product listings with images, prices, and ratings. Each item shows the product name, current price, and customer rating."
```

### List Widget
```typescript
widgetDescription: "Presents a vertical list of [data type] showing [display fields]. Each entry includes [information list]."
```

**Example**:
```typescript
widgetDescription: "Presents a vertical list of tasks showing status, assignee, and due date. Each entry includes a checkbox for completion and a link to detailed view."
```

### Chart/Graph Widget
```typescript
widgetDescription: "Visualizes [data type] as a [chart type] displaying [axis information]. Shows [displayed insights]."
```

**Example**:
```typescript
widgetDescription: "Visualizes sales data as a line chart displaying revenue over time. Shows monthly trends, peaks, and comparison with previous year."
```

### Form Widget
```typescript
widgetDescription: "Provides an interactive form for [purpose]. Includes input fields for [field list] and allows users to [possible actions]."
```

**Example**:
```typescript
widgetDescription: "Provides an interactive form for creating a new task. Includes input fields for title, description, assignee, and due date, and allows users to save or cancel."
```

## 🎨 Real Examples

### Example 1: Todo List
```typescript
{
  id: "todo-list",
  title: "Show Todo List",
  meta: {
    widgetDescription: "Renders an interactive todo list showing tasks with their completion status, priority, and due dates. Users can check off items and see task details inline."
  }
}
```

### Example 2: Weather Dashboard
```typescript
{
  id: "weather-dashboard",
  title: "Show Weather Dashboard",
  meta: {
    widgetDescription: "Displays a comprehensive weather dashboard showing current conditions, 7-day forecast, temperature graphs, and precipitation chances. Includes hourly breakdown and weather alerts if any."
  }
}
```

### Example 3: File Browser
```typescript
{
  id: "file-browser",
  title: "Show File Browser",
  meta: {
    widgetDescription: "Renders a file system browser displaying folders and files with icons, names, sizes, and modification dates. Users can navigate folders and see file previews on hover."
  }
}
```

## ⚠️ Warnings

### 1. Don't directly instruct model behavior
```typescript
// ❌ Bad
widgetDescription: "Shows a map. You should not repeat the location names."

// ✅ Good
widgetDescription: "Renders a map displaying location names and addresses for all listed places."
```

### 2. Only describe the widget's visual aspects
```typescript
// ❌ Bad
widgetDescription: "This widget was built using React and Leaflet. It queries our API."

// ✅ Good
widgetDescription: "Renders an interactive map with location markers and info popups."
```

### 3. Don't write too long
```typescript
// ❌ Bad (250 words...)
widgetDescription: "This is an amazing widget that shows you all the pizza places in your area. It has been carefully designed with user experience in mind and includes..."

// ✅ Good (2-3 sentences)
widgetDescription: "Renders an interactive map showing pizza places with ratings and locations. Users can click markers to see detailed information."
```

## 📊 Testing Method

After deploying the widget:

1. **Start a conversation that renders the widget**
2. **Observe the model's response**:
   - Does it repeat information already shown in the widget?
   - Does it provide concise and natural guidance?
3. **Adjust widgetDescription if needed**

## 🔗 References

- [OpenAI Apps SDK - Component Descriptions](https://developers.openai.com/apps-sdk/build/mcp-server#add-component-descriptions)
- [OpenAI Apps SDK - Design Guidelines](https://developers.openai.com/apps-sdk/core-concepts/design-guidelines)

## 💡 Quick Checklist

When writing widgetDescription:

- [ ] Does it clearly explain **what the widget shows**?
- [ ] Does it specifically list **displayed data fields**?
- [ ] Does it mention **user interactions** (click, scroll, etc.)?
- [ ] Is it written **concisely** in 2-3 sentences?
- [ ] Does it **not** contain instructions for model behavior?
- [ ] Have you **excluded** technical implementation details?

---

Following this guide will help the model better understand widgets and provide a more natural conversation experience for users! 🎉
