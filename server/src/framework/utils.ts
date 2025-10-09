import type { z } from "zod";

/**
 * Convert Zod schema to JSON Schema
 * Simple implementation - can be replaced with zod-to-json-schema library if needed
 */
export function zodToJsonSchema(schema: z.ZodType): any {
  // Extract ZodObject's shape and convert to JSON Schema
  const zodDef = (schema as any)._def;
  
  if (zodDef.typeName === "ZodObject") {
    const shape = zodDef.shape();
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodType;
      const fieldDef = (fieldSchema as any)._def;
      
      // Basic type mapping
      let type = "string";
      let description = fieldDef.description;
      
      if (fieldDef.typeName === "ZodString") {
        type = "string";
      } else if (fieldDef.typeName === "ZodNumber") {
        type = "number";
      } else if (fieldDef.typeName === "ZodBoolean") {
        type = "boolean";
      } else if (fieldDef.typeName === "ZodArray") {
        type = "array";
      } else if (fieldDef.typeName === "ZodObject") {
        type = "object";
      }
      
      properties[key] = {
        type,
        ...(description && { description })
      };
      
      // Add to required if not optional
      if (!fieldDef.isOptional && fieldDef.typeName !== "ZodOptional") {
        required.push(key);
      }
    }
    
    return {
      type: "object",
      properties,
      required,
      additionalProperties: false
    };
  }
  
  // Return object type by default
  return {
    type: "object",
    properties: {},
    additionalProperties: true
  };
}

/**
 * Generate widget metadata
 */
export function generateWidgetMeta(
  widgetId: string, 
  title: string, 
  invoking?: string, 
  invoked?: string,
  widgetDescription?: string
) {
  const templateUri = `ui://widget/${widgetId}.html`;
  
  const meta: Record<string, any> = {
    "openai/outputTemplate": templateUri,
    "openai/toolInvocation/invoking": invoking || `Loading ${title}...`,
    "openai/toolInvocation/invoked": invoked || `Loaded ${title}`,
    "openai/widgetAccessible": true,
    "openai/resultCanProduceWidget": true
  };
  
  // Add widgetDescription if provided
  if (widgetDescription) {
    meta["openai/widgetDescription"] = widgetDescription;
  }
  
  return meta;
}

/**
 * Generate widget HTML
 */
export function generateWidgetHtml(rootElement: string, htmlSrc: string, cssSrc?: string): string {
  const parts = [`<div id="${rootElement}"></div>`];
  
  if (cssSrc) {
    parts.push(`<link rel="stylesheet" href="${cssSrc}">`);
  }
  
  parts.push(`<script type="module" src="${htmlSrc}"></script>`);
  
  return parts.join('\n');
}

