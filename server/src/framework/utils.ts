import type { z } from "zod";

/**
 * Zod 스키마를 JSON Schema로 변환
 * 간단한 구현 - 필요시 zod-to-json-schema 라이브러리로 대체 가능
 */
export function zodToJsonSchema(schema: z.ZodType): any {
  // ZodObject의 shape을 추출하여 JSON Schema로 변환
  const zodDef = (schema as any)._def;
  
  if (zodDef.typeName === "ZodObject") {
    const shape = zodDef.shape();
    const properties: Record<string, any> = {};
    const required: string[] = [];
    
    for (const [key, value] of Object.entries(shape)) {
      const fieldSchema = value as z.ZodType;
      const fieldDef = (fieldSchema as any)._def;
      
      // 기본 타입 매핑
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
      
      // optional이 아니면 required에 추가
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
  
  // 기본적으로 object 타입 반환
  return {
    type: "object",
    properties: {},
    additionalProperties: true
  };
}

/**
 * 위젯 메타데이터 생성
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
  
  // widgetDescription이 있으면 추가
  if (widgetDescription) {
    meta["openai/widgetDescription"] = widgetDescription;
  }
  
  return meta;
}

/**
 * 위젯 HTML 생성
 */
export function generateWidgetHtml(rootElement: string, htmlSrc: string, cssSrc?: string): string {
  const parts = [`<div id="${rootElement}"></div>`];
  
  if (cssSrc) {
    parts.push(`<link rel="stylesheet" href="${cssSrc}">`);
  }
  
  parts.push(`<script type="module" src="${htmlSrc}"></script>`);
  
  return parts.join('\n');
}

