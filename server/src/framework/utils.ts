import type { z } from "zod";
import crypto from "node:crypto";

/**
 * Convert Zod schema to JSON Schema
 * Simple implementation - can be replaced with zod-to-json-schema library if needed
 */
export function zodToJsonSchema(schema: z.ZodType): any {
  // Extract shape from ZodObject and convert to JSON Schema
  const zodDef = (schema as any)._def;
  
  if (zodDef.typeName === "ZodObject") {
    const shape = zodDef.shape();
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      let fieldDef = (value as any)._def;
      let isOptional = false;
      let description: string | undefined;

      // Unwrap nested types (ZodOptional, ZodEffects, ZodDefault)
      // Capture description from any layer (first non-undefined wins)
      while (fieldDef) {
        if (fieldDef.description && !description) {
          description = fieldDef.description;
        }
        if (fieldDef.typeName === "ZodOptional" || fieldDef.typeName === "ZodNullable") {
          isOptional = true;
          fieldDef = fieldDef.innerType?._def;
        } else if (fieldDef.typeName === "ZodEffects") {
          // .coerce wraps in ZodEffects
          fieldDef = fieldDef.schema?._def;
        } else if (fieldDef.typeName === "ZodDefault") {
          fieldDef = fieldDef.innerType?._def;
        } else {
          break;
        }
      }

      if (!fieldDef) continue;

      // Also check the final unwrapped type for description
      if (fieldDef.description && !description) {
        description = fieldDef.description;
      }

      // Map basic types
      let type = "string";

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
      if (!isOptional) {
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
  
  // Default to object type
  return {
    type: "object",
    properties: {},
    additionalProperties: true
  };
}

/**
 * Generate asset hash from version string
 * Uses the same logic as build-all.mts
 */
export function generateAssetHash(version: string): string {
  return crypto
    .createHash("sha256")
    .update(version, "utf8")
    .digest("hex")
    .slice(0, 4);
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

