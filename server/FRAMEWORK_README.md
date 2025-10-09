# MCP Widget Server Framework

위젯과 스키마만 정의하면 MCP 서버를 자동으로 생성해주는 프레임워크입니다.

## 🚀 특징

- **간단한 API**: 위젯 정의만 하면 MCP 리소스와 서버가 자동 생성됨
- **타입 안전성**: TypeScript와 Zod를 활용한 완전한 타입 안전성
- **자동화**: Tool, Resource, ResourceTemplate 자동 생성
- **확장 가능**: 새로운 위젯 추가가 매우 간단함

## 📦 구조

```
framework/
├── index.ts           # 메인 export 파일
├── types.ts           # 타입 정의
├── utils.ts           # 유틸리티 함수
└── widget-server.ts   # 서버 클래스
```

## 🔧 사용법

### 1. 위젯 정의

```typescript
import { z } from "zod";
import { createMcpWidgetServer } from "./framework/index.js";

const widgets = [
  {
    // 필수 필드
    id: "my-widget",                    // 위젯 고유 ID
    title: "My Awesome Widget",          // 위젯 표시 이름
    htmlSrc: "http://localhost:4444/widget.js",  // JS 파일 URL
    rootElement: "widget-root",          // 렌더링될 DOM 엘리먼트 ID
    
    // 입력 스키마 (Zod)
    schema: z.object({
      param1: z.string().describe("First parameter"),
      param2: z.number().optional().describe("Optional second parameter")
    }),
    
    // 핸들러 함수
    handler: async (args) => ({
      text: "Widget rendered successfully!",
      data: args  // 구조화된 데이터 (선택사항)
    }),
    
    // 선택적 필드
    description: "A detailed description",  // 위젯 설명
    cssSrc: "http://localhost:4444/widget.css",  // CSS 파일 URL
    meta: {
      invoking: "Loading widget...",     // 로딩 중 메시지
      invoked: "Widget loaded!",          // 로드 완료 메시지
      widgetDescription: "Renders an interactive UI showcasing the data returned by this tool. Helps the model understand what is being displayed to avoid redundant responses."  // 모델을 위한 위젯 설명
    }
  }
];
```

### 2. 서버 생성 및 시작

```typescript
const server = createMcpWidgetServer({
  name: "my-widget-server",
  version: "1.0.0",
  widgets,
  port: 8000  // 선택사항, 기본값 8000
});

server.start();
```

끝! 🎉

## 📝 예제: 기존 server.ts와 비교

### Before (기존 코드 - 392줄)

```typescript
// 위젯 타입 정의
type PizzazWidget = { ... };

// 위젯 배열
const widgets: PizzazWidget[] = [ ... ];

// Map 생성
const widgetsById = new Map(...);
const widgetsByUri = new Map(...);

// 스키마 정의
const widgetSchemas = { ... };

// 파서 생성
const pizzaInputParser = z.object({ ... });

// MCP 타입 생성
const tools: Tool[] = widgets.map(...);
const resources: Resource[] = widgets.map(...);
const resourceTemplates: ResourceTemplate[] = widgets.map(...);

// 서버 생성 함수
function createPizzazServer(): Server {
  const server = new Server(...);
  
  // 핸들러 등록 (70줄 이상)
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  server.setRequestHandler(...);
  
  return server;
}

// 세션 관리
const sessions = new Map<string, SessionRecord>();

// SSE 핸들러 (27줄)
async function handleSseRequest(...) { ... }

// POST 핸들러 (30줄)
async function handlePostMessage(...) { ... }

// HTTP 서버 생성 (35줄)
const httpServer = createServer(...);
httpServer.listen(...);
```

### After (프레임워크 사용 - 93줄)

```typescript
import { z } from "zod";
import { createMcpWidgetServer } from "./framework/index.js";

// 위젯 정의만!
const widgets = [
  {
    id: "pizza-map",
    title: "Show Pizza Map",
    htmlSrc: "http://localhost:4444/pizzaz-2d2b.js",
    cssSrc: "http://localhost:4444/pizzaz-2d2b.css",
    rootElement: "pizzaz-root",
    schema: z.object({
      pizzaTopping: z.string().describe("Topping to mention")
    }),
    handler: async (args) => ({
      text: "Rendered a pizza map!",
      data: { pizzaTopping: args.pizzaTopping }
    }),
    meta: {
      invoking: "Hand-tossing a map",
      invoked: "Served a fresh map"
    }
  }
  // ... 더 많은 위젯
];

// 서버 생성 및 시작
const server = createMcpWidgetServer({
  name: "pizzaz-node",
  version: "0.1.0",
  widgets,
  port: 8000
});

server.start();
```

**결과: 392줄 → 93줄 (76% 코드 감소!) 🎯**

## 🔥 주요 개선사항

1. **보일러플레이트 제거**: MCP 프로토콜 관련 코드를 프레임워크에서 처리
2. **선언적 API**: 위젯 정의만으로 모든 것이 자동 생성
3. **타입 안전성**: Zod 스키마에서 TypeScript 타입 자동 추론
4. **확장성**: 새 위젯 추가가 배열에 객체 하나 추가하는 것으로 끝남
5. **재사용성**: 다른 프로젝트에서도 프레임워크를 그대로 사용 가능

## 🎯 새 위젯 추가하기

기존에는 여러 곳을 수정해야 했지만, 이제는:

```typescript
// widgets 배열에 추가만 하면 끝!
const widgets = [
  // ... 기존 위젯들
  {
    id: "new-widget",
    title: "New Widget",
    htmlSrc: "http://localhost:4444/new-widget.js",
    rootElement: "new-widget-root",
    schema: z.object({
      param: z.string()
    }),
    handler: async (args) => ({
      text: "New widget works!"
    })
  }
];
```

## 🛠️ 프레임워크 내부 동작

프레임워크가 자동으로 처리하는 것들:

1. **Tool 생성**: 위젯 정의 → MCP Tool 변환
2. **Resource 생성**: 위젯 정의 → MCP Resource 변환
3. **ResourceTemplate 생성**: 위젯 정의 → MCP ResourceTemplate 변환
4. **HTML 생성**: rootElement, htmlSrc, cssSrc → 완전한 HTML
5. **메타데이터 생성**: OpenAI 위젯 메타데이터 자동 생성
6. **핸들러 등록**: ListTools, ListResources, ReadResource, CallTool 자동 등록
7. **세션 관리**: SSE 세션 생성/삭제 자동 처리
8. **HTTP 서버**: CORS, 라우팅, 에러 처리 자동 설정

## 🧪 테스트

서버 실행:
```bash
cd chatjs/server
pnpm install
pnpm start
```

확인:
```bash
curl http://localhost:8000/mcp
```

## 📚 API 레퍼런스

### `createMcpWidgetServer(config: ServerConfig)`

MCP 위젯 서버를 생성합니다.

**Parameters:**
- `config.name`: 서버 이름
- `config.version`: 서버 버전
- `config.widgets`: 위젯 정의 배열
- `config.port?`: HTTP 포트 (기본값: 8000)
- `config.ssePath?`: SSE 엔드포인트 경로 (기본값: "/mcp")
- `config.postPath?`: POST 엔드포인트 경로 (기본값: "/mcp/messages")

**Returns:** `McpWidgetServer` 인스턴스

### `WidgetDefinition<TSchema>`

위젯 정의 타입입니다.

**Required Fields:**
- `id`: 위젯 고유 ID
- `title`: 위젯 표시 이름
- `htmlSrc`: JavaScript 파일 URL
- `rootElement`: 렌더링될 DOM 엘리먼트 ID
- `schema`: Zod 입력 스키마
- `handler`: 위젯 호출 핸들러 함수

**Optional Fields:**
- `description`: 위젯 설명
- `cssSrc`: CSS 파일 URL
- `meta.invoking`: 로딩 중 메시지
- `meta.invoked`: 로드 완료 메시지
- `meta.widgetDescription`: 모델을 위한 위젯 설명 (OpenAI 문서 권장)

## 💡 베스트 프랙티스

1. **스키마에 설명 추가**: `.describe()`를 사용하여 AI가 이해할 수 있도록
2. **의미있는 ID 사용**: 위젯 ID는 명확하고 설명적으로
3. **에러 처리**: handler 함수에서 적절한 에러 처리
4. **메타 메시지 커스터마이징**: 사용자 경험을 위해 invoking/invoked 메시지 설정
5. **위젯 설명 작성**: `widgetDescription`을 작성하여 모델이 위젯의 역할을 이해하고 중복 응답을 피하도록 설정 (OpenAI 권장)

## ✅ 지원하는 OpenAI Apps SDK 기능

- ✅ **MCP 서버 구조**: 완벽 지원
- ✅ **Tool/Resource/ResourceTemplate**: 자동 생성
- ✅ **메타데이터**: outputTemplate, invoking, invoked
- ✅ **structuredContent & content**: 완벽 지원
- ✅ **위젯 설명** (`openai/widgetDescription`): 지원 ✨
- ✅ **위젯 액세스** (`openai/widgetAccessible`): 자동 설정

## 🔮 향후 개선 가능 사항

- [ ] Content Security Policy (CSP) 설정
- [ ] 지역화(i18n) 지원 (`openai/locale`)
- [ ] 커스텀 서브도메인 (`openai/widgetDomain`)
- [ ] 위젯 보더 설정 (`openai/widgetPrefersBorder`)
- [ ] 더 복잡한 Zod 스키마 지원 (중첩 객체, 배열 등)
- [ ] 위젯 간 의존성 관리
- [ ] 런타임 위젯 추가/제거
- [ ] 위젯 상태 관리
- [ ] 로깅 및 모니터링 기능
- [ ] 인증/인가 지원

## 📄 라이센스

MIT

