# Widget Description 가이드

## 📖 개요

`widgetDescription`은 OpenAI Apps SDK에서 **모델이 렌더링된 위젯을 이해**하도록 돕는 메타데이터입니다. 이를 통해 모델은 사용자에게 이미 보여진 정보를 중복해서 설명하지 않고, 더 자연스러운 대화를 이어갈 수 있습니다.

## 🎯 왜 필요한가?

### Before (widgetDescription 없이)
```
User: Show me pizza places
Assistant: Here's a map of pizza places! 🗺️

Let me list them for you:
1. Joe's Pizza - Located at 123 Main St
2. Tony's Pizzeria - Located at 456 Oak Ave
3. Mario's Pizza - Located at 789 Elm St
...
```
❌ **문제**: 지도에 이미 모든 정보가 표시되는데 텍스트로 또 반복

### After (widgetDescription 사용)
```
User: Show me pizza places
Assistant: Here's a map of pizza places! 🗺️

You can click on the markers to see details about each location.
```
✅ **개선**: 위젯이 무엇을 보여주는지 모델이 이해하고, 간단한 안내만 제공

## 📝 작성 방법

### 1. 좋은 widgetDescription

```typescript
{
  id: "pizza-map",
  title: "Show Pizza Map",
  meta: {
    widgetDescription: "Renders an interactive map showing pizza places with markers and location details. Displays information about the selected pizza topping."
  }
}
```

**특징**:
- ✅ 위젯이 **무엇을 보여주는지** 명확히 설명
- ✅ 어떤 **데이터가 표시되는지** 구체적으로 기술
- ✅ 사용자가 **볼 수 있는 정보**를 명시

### 2. 나쁜 widgetDescription

```typescript
// ❌ 너무 짧음
widgetDescription: "Shows a map"

// ❌ 모델 행동을 조종하려 함
widgetDescription: "Displays a map. Don't list the locations again."

// ❌ 위젯과 관련 없는 정보
widgetDescription: "This is a great pizza finder tool built with React."
```

## 📋 템플릿

### 지도 위젯
```typescript
widgetDescription: "Renders an interactive map displaying [데이터 타입] with [표시되는 정보]. Users can interact with markers to see [상세 정보]."
```

**예시**:
```typescript
widgetDescription: "Renders an interactive map displaying restaurant locations with names, ratings, and addresses. Users can interact with markers to see detailed information about each restaurant."
```

### 캐러셀 위젯
```typescript
widgetDescription: "Displays a horizontally scrollable carousel showing [데이터 타입] with [표시 항목]. Each item shows [정보 리스트]."
```

**예시**:
```typescript
widgetDescription: "Displays a horizontally scrollable carousel showing product listings with images, prices, and ratings. Each item shows the product name, current price, and customer rating."
```

### 리스트 위젯
```typescript
widgetDescription: "Presents a vertical list of [데이터 타입] showing [표시 필드]. Each entry includes [정보 리스트]."
```

**예시**:
```typescript
widgetDescription: "Presents a vertical list of tasks showing status, assignee, and due date. Each entry includes a checkbox for completion and a link to detailed view."
```

### 차트/그래프 위젯
```typescript
widgetDescription: "Visualizes [데이터 타입] as a [차트 종류] displaying [축 정보]. Shows [표시되는 인사이트]."
```

**예시**:
```typescript
widgetDescription: "Visualizes sales data as a line chart displaying revenue over time. Shows monthly trends, peaks, and comparison with previous year."
```

### 폼 위젯
```typescript
widgetDescription: "Provides an interactive form for [목적]. Includes input fields for [필드 리스트] and allows users to [가능한 액션]."
```

**예시**:
```typescript
widgetDescription: "Provides an interactive form for creating a new task. Includes input fields for title, description, assignee, and due date, and allows users to save or cancel."
```

## 🎨 실제 예시

### 예시 1: Todo 리스트
```typescript
{
  id: "todo-list",
  title: "Show Todo List",
  meta: {
    widgetDescription: "Renders an interactive todo list showing tasks with their completion status, priority, and due dates. Users can check off items and see task details inline."
  }
}
```

### 예시 2: 날씨 대시보드
```typescript
{
  id: "weather-dashboard",
  title: "Show Weather Dashboard",
  meta: {
    widgetDescription: "Displays a comprehensive weather dashboard showing current conditions, 7-day forecast, temperature graphs, and precipitation chances. Includes hourly breakdown and weather alerts if any."
  }
}
```

### 예시 3: 파일 브라우저
```typescript
{
  id: "file-browser",
  title: "Show File Browser",
  meta: {
    widgetDescription: "Renders a file system browser displaying folders and files with icons, names, sizes, and modification dates. Users can navigate folders and see file previews on hover."
  }
}
```

## ⚠️ 주의사항

### 1. 모델 행동을 직접 지시하지 마세요
```typescript
// ❌ 나쁨
widgetDescription: "Shows a map. You should not repeat the location names."

// ✅ 좋음
widgetDescription: "Renders a map displaying location names and addresses for all listed places."
```

### 2. 위젯의 시각적 측면만 설명하세요
```typescript
// ❌ 나쁨
widgetDescription: "This widget was built using React and Leaflet. It queries our API."

// ✅ 좋음
widgetDescription: "Renders an interactive map with location markers and info popups."
```

### 3. 너무 길게 쓰지 마세요
```typescript
// ❌ 나쁨 (250단어...)
widgetDescription: "This is an amazing widget that shows you all the pizza places in your area. It has been carefully designed with user experience in mind and includes..."

// ✅ 좋음 (2-3문장)
widgetDescription: "Renders an interactive map showing pizza places with ratings and locations. Users can click markers to see detailed information."
```

## 📊 테스트 방법

위젯을 배포한 후:

1. **위젯을 렌더링하는 대화를 시작하세요**
2. **모델의 응답을 관찰하세요**:
   - 위젯에 이미 표시된 정보를 반복하나요?
   - 간결하고 자연스러운 안내를 제공하나요?
3. **필요시 widgetDescription을 조정하세요**

## 🔗 참고 자료

- [OpenAI Apps SDK - Component Descriptions](https://developers.openai.com/apps-sdk/build/mcp-server#add-component-descriptions)
- [OpenAI Apps SDK - Design Guidelines](https://developers.openai.com/apps-sdk/core-concepts/design-guidelines)

## 💡 빠른 체크리스트

widgetDescription을 작성할 때:

- [ ] 위젯이 **무엇을 보여주는지** 명확히 설명했나요?
- [ ] **표시되는 데이터 필드**를 구체적으로 나열했나요?
- [ ] **사용자 인터랙션**을 언급했나요? (클릭, 스크롤 등)
- [ ] 2-3문장으로 **간결하게** 작성했나요?
- [ ] 모델 행동을 지시하는 내용은 **없나요**?
- [ ] 기술적인 구현 세부사항은 **제외**했나요?

---

이 가이드를 따라 작성하면 모델이 위젯을 더 잘 이해하고, 사용자에게 더 자연스러운 대화 경험을 제공할 수 있습니다! 🎉

