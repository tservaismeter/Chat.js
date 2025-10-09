import type { z } from "zod";

/**
 * 위젯 정의 타입
 * 사용자가 위젯을 정의할 때 사용하는 핵심 타입
 */
export type WidgetDefinition<TSchema extends z.ZodType = z.ZodType> = {
  /** 위젯의 고유 ID (tool name으로 사용됨) */
  id: string;
  
  /** 위젯의 표시 이름 */
  title: string;
  
  /** 위젯에 대한 설명 (선택사항) */
  description?: string;
  
  /** 위젯의 JavaScript 파일 URL */
  htmlSrc: string;
  
  /** 위젯의 CSS 파일 URL (선택사항) */
  cssSrc?: string;
  
  /** 위젯이 렌더링될 루트 엘리먼트 ID */
  rootElement: string;
  
  /** 입력 파라미터 스키마 (Zod 스키마) */
  schema: TSchema;
  
  /** 위젯 호출 시 실행될 핸들러 함수 */
  handler: (args: z.infer<TSchema>) => Promise<WidgetHandlerResult>;
  
  /** 추가 메타데이터 (선택사항) */
  meta?: {
    /** 위젯 로딩 중 메시지 */
    invoking?: string;
    /** 위젯 로드 완료 메시지 */
    invoked?: string;
    /** 위젯 설명 - 모델이 위젯의 역할을 이해하도록 도움 */
    widgetDescription?: string;
  };
};

/**
 * 위젯 핸들러가 반환하는 결과 타입
 */
export type WidgetHandlerResult = {
  /** 사용자에게 보여질 텍스트 응답 */
  text: string;
  
  /** 구조화된 데이터 (선택사항) */
  data?: Record<string, any>;
};

/**
 * MCP 위젯 서버 설정
 */
export type ServerConfig = {
  /** 서버 이름 */
  name: string;
  
  /** 서버 버전 */
  version: string;
  
  /** 위젯 정의 배열 */
  widgets: WidgetDefinition[];
  
  /** HTTP 서버 포트 (기본값: 8000) */
  port?: number;
  
  /** SSE 엔드포인트 경로 (기본값: "/mcp") */
  ssePath?: string;
  
  /** POST 메시지 엔드포인트 경로 (기본값: "/mcp/messages") */
  postPath?: string;
};

/**
 * 내부적으로 사용되는 위젯 메타데이터
 */
export type WidgetMeta = {
  id: string;
  title: string;
  templateUri: string;
  html: string;
  definition: WidgetDefinition;
};

