# GitHub 사용자 검색 애플리케이션 - 사용한 프롬프트 정리

## 목차

1. [프로젝트 초기 설정](#프로젝트-초기-설정)
2. [GitHub API 통합](#github-api-통합)
3. [검색 기능 구현](#검색-기능-구현)
4. [Redux Toolkit 상태 관리](#redux-toolkit-상태-관리)
5. [무한 스크롤 구현](#무한-스크롤-구현)
6. [무한 스크롤 버그 수정](#무한-스크롤-버그-수정)
7. [SSR 첫 페이지 구현](#ssr-첫-페이지-구현)
8. [UI 컴포넌트 구현](#ui-컴포넌트-구현)
9. [Canvas + WebAssembly 아바타 렌더링](#canvas--webassembly-아바타-렌더링)
10. [테스트 코드 작성](#테스트-코드-작성)
11. [문서화](#문서화)

---

## 프로젝트 초기 설정

### 프로젝트 구조 및 초기 세팅

**요청 프롬프트:**

```
Next.js 14 App Router와 TypeScript, pnpm을 기반으로 프로젝트를 초기 설정해주세요.
Clean Architecture 폴더 구조를 생성하고, MUI와 Tailwind CSS를 통합 설정해주세요.
Redux Toolkit store도 함께 구성해주세요.
```

**Claude 응답:**

- 프로젝트 기본 구조 생성
  - `src/domain` - 비즈니스 엔티티 및 인터페이스
  - `src/application` - 유즈케이스 및 비즈니스 로직
  - `src/infrastructure` - 외부 API, 데이터 소스
  - `src/presentation` - UI 컴포넌트 및 페이지
- `package.json` 설정 (pnpm workspace, turbo)
- Next.js 14 설정 파일 생성
- MUI ThemeProvider + Tailwind CSS 다크모드 동기화 설정 제공

**수정/커스터마이징:**

- MUI와 Tailwind CSS 충돌 방지를 위해 `tailwind.config.ts`에 `important: true` 옵션 추가
- 폰트 설정을 SF Pro → Noto Sans 폴백으로 구성
- `next.config.js`에서 이미지 최적화 도메인 추가

**최종 코드 위치:**

```
package.json
next.config.js
src/app/layout.tsx
tailwind.config.ts
tsconfig.json
```

---

## GitHub API 통합

### 서버 라우트 API 구현

**요청 프롬프트:**

```
GitHub Search Users API를 호출하는 서버 라우트를 구현해주세요.
Authorization token 헤더를 추가하고, Rate Limit를 처리해주세요.
X-RateLimit-Remaining 헤더를 확인하고, 초과 시 Exponential Backoff으로 재시도하는 로직도 포함해주세요.
```

**Claude 응답:**

- `/api/github/search` Next.js 서버 라우트 생성
- GitHub API 호출 시 `Authorization: token ${GITHUB_TOKEN}` 헤더 추가
- Rate Limit 체크 로직:

```typescript
const remaining = parseInt(
  response.headers.get('X-RateLimit-Remaining') || '0'
);
if (remaining === 0) {
  // Exponential Backoff 재시도
}
```

- 환경변수 `.env.local` 설정 가이드 제공

**수정/커스터마이징:**

- Rate Limit 초과 시 UI에 알림을 표시하도록 에러 응답 형식 통일
- 재시도 횟수를 최대 3회로 제한
- 재시도 대기 시간: 1초 → 2초 → 4초 (지수 증가)

**최종 코드 위치:**

```
src/app/api/github/search/route.ts
src/infrastructure/api/github-client.ts
.env.local
```

---

## 검색 기능 구현

### 8가지 검색 필터 쿼리 빌더

**요청 프롬프트:**

```
GitHub Search Qualifiers를 활용한 쿼리 빌더를 구현해주세요.
다음 8가지 필터를 지원해야 합니다:
1. type:user 또는 type:org
2. in:login, in:name, in:email
3. repos:>N 또는 repos:N..M
4. location:Seoul
5. language:TypeScript
6. created:>2020-01-01 또는 created:2020..2023
7. followers:>100 또는 followers:50..200
8. is:sponsorable

각 필터를 조합하여 하나의 검색 쿼리 문자열을 생성하는 함수를 만들어주세요.
```

**Claude 응답:**

- `SearchFilters` TypeScript 인터페이스 정의:

```typescript
export interface SearchFilters {
  query: string;
  type?: 'user' | 'org';
  in?: ('login' | 'name' | 'email')[];
  repos?: { min?: number; max?: number };
  location?: string;
  language?: string;
  created?: { start?: string; end?: string };
  followers?: { min?: number; max?: number };
  isSponssorable?: boolean;
}
```

- `buildSearchQuery` 함수 구현 - 각 필터를 GitHub 쿼리 문법으로 변환
- 유효성 검증 로직 포함 (날짜 형식, 숫자 범위 등)

**수정/커스터마이징:**

- 날짜 범위 검색 로직 개선 (`created:2020-01-01..2023-12-31` 형식)
- 숫자 범위 검색 시 단일 값과 범위 모두 지원하도록 개선
- 쿼리 빌더 테스트 케이스 추가

**최종 코드 위치:**

```
src/domain/types/filters.ts
src/application/use-cases/build-search-query.ts
src/application/use-cases/__tests__/build-search-query.test.ts
```

---

## Redux Toolkit 상태 관리

### Redux Store 및 Slice 구성

**요청 프롬프트:**

```
Redux Toolkit을 활용하여 전역 상태 관리를 구현해주세요.
검색 결과, 필터 상태, 페이징 정보, 로딩 상태를 관리해야 합니다.
TypeScript 타입 안전성을 확보하고, Redux DevTools도 통합해주세요.
```

**Claude 응답:**

- `configureStore`로 Redux store 설정
- `searchSlice` 생성:
  - State: `users`, `filters`, `page`, `totalCount`, `hasMore`, `loading`, `error`, `rateLimit`
  - Reducers: `setFilters`, `setPage`, `appendUsers`, `resetSearch`
  - Async Thunks: `fetchUsers`, `fetchMoreUsers`
- Redux DevTools 자동 통합
- TypeScript 타입 내보내기: `RootState`, `AppDispatch`

**수정/커스터마이징:**

- 무한 스크롤을 위한 `appendUsers` reducer 추가 (기존 결과에 새 결과 추가)
- Rate Limit 정보 저장 상태 추가 (`remaining`, `reset` 시간)
- 에러 상태 초기화 로직 개선

**최종 코드 위치:**

```
src/infrastructure/store/index.ts
src/infrastructure/store/slices/search-slice.ts
src/infrastructure/store/hooks.ts
```

---

## 무한 스크롤 구현

### Intersection Observer 기반 무한 스크롤

**요청 프롬프트:**

```
CSR 환경에서 Intersection Observer를 활용한 무한 스크롤을 구현해주세요.
Sentinel 요소가 뷰포트에 들어오면 자동으로 다음 페이지를 로드해야 합니다.
중복 호출을 방지하고, 로딩 상태와 에러 핸들링도 포함해주세요.
```

**Claude 응답:**

- `useInfiniteScroll` 커스텀 훅 구현:

```typescript
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(/* ... */);
    // Sentinel 요소 감지 시 callback 호출
  }, [callback, hasMore, loading]);

  return sentinelRef;
}
```

- Sentinel 요소가 화면에 나타나면 자동으로 `fetchMoreUsers` dispatch
- 로딩 중이거나 더 이상 데이터가 없으면 호출 방지

**수정/커스터마이징:**

- GitHub API의 1000개 결과 제한 처리 (10페이지 = 100개 × 10 초과 시 중단)
- 에러 상태와 정상 완료 상태를 명확히 구분 (불필요한 에러 메시지 제거)
- 개발 환경에서만 상세 로깅 출력하도록 설정

**최종 코드 위치:**

```
src/presentation/hooks/use-infinite-scroll.ts
src/presentation/components/user-list/UserList.tsx
```

---

## 무한 스크롤 버그 수정

### 페이징 로직 디버깅

**요청 프롬프트:**

```
무한 스크롤이 제대로 작동하지 않습니다.
첫 페이지만 로드되고 스크롤해도 추가 데이터가 로드되지 않습니다.
API 응답, Redux 상태 업데이트, UI 렌더링의 전체 플로우를 추적하여 문제를 찾아주세요.
상세한 로깅을 추가하여 각 단계에서 데이터가 어떻게 변환되는지 확인해야 합니다.
```

**Claude 응답:**
문제 원인 3가지 발견:

1. **API Mapper 문제**
   - `user-mapper.ts`에서 `total_count`를 매핑하지 않음
   - 수정: API 응답의 `total_count`를 결과 객체에 포함

2. **Redux Slice 로직 문제**
   - `hasMore` 계산이 잘못됨
   - 수정: `currentCount < total_count`로 변경

3. **컴포넌트 상태 감지 문제**
   - Redux 상태 변화를 제대로 감지하지 못함
   - 수정: `useSelector`로 정확한 상태 구독

상세 로깅 추가:

```typescript
// API 응답 로깅
console.log('[API Response]', {
  items: data.items.length,
  total_count: data.total_count,
});

// Redux 상태 업데이트 후 로깅
console.log('[Redux State]', {
  users: state.users.length,
  hasMore: state.hasMore,
});

// 컴포넌트 렌더링 시 로깅
console.log('[Component Render]', { users, hasMore, loading });
```

**수정/커스터마이징:**

- API 응답 전체 구조 검증 (`items`, `total_count`, `incomplete_results` 모두 확인)
- Redux 상태 업데이트 직후 즉시 확인하는 로직 추가
- 디버깅 완료 후 불필요한 콘솔 출력 제거 (클린한 사용자 경험 유지)
- GitHub API의 최대 1000개 제한 명시적 처리

**최종 코드 위치:**

```
src/infrastructure/api/mappers/user-mapper.ts
src/infrastructure/store/slices/search-slice.ts
src/presentation/components/user-list/UserList.tsx
```

---

## SSR 첫 페이지 구현

### Next.js App Router SSR

**요청 프롬프트:**

```
첫 페이지를 서버 사이드 렌더링으로 구현해주세요.
검색 파라미터를 URL 쿼리스트링으로 전달하고, 서버에서 데이터를 fetch한 후 초기 HTML에 포함해주세요.
서버 컴포넌트와 클라이언트 컴포넌트를 명확히 분리해야 합니다.
```

**Claude 응답:**

- `app/page.tsx`를 서버 컴포넌트로 구현:

```typescript
  export default async function Home({ searchParams }: { searchParams: { q?: string } }) {
    const initialData = await fetchUsersOnServer(searchParams.q || '');

    return <SearchPage initialData={initialData} />;
  }
```

- 초기 데이터를 클라이언트 컴포넌트(`SearchPage.tsx`)로 props 전달
- 클라이언트 컴포넌트에서 Redux store 초기화 시 초기 데이터 사용
- Hydration 에러 방지를 위한 `useEffect` 분리

**수정/커스터마이징:**

- 클라이언트 전용 컴포넌트에 `'use client'` 지시어 명확히 추가
- 초기 로딩 상태에서 스켈레톤 UI 표시
- 서버 에러 발생 시 에러 바운더리로 처리

**최종 코드 위치:**

```
src/app/page.tsx
src/presentation/components/search/SearchPage.tsx
src/infrastructure/api/server-actions.ts
```

---

## UI 컴포넌트 구현

### MUI + Tailwind CSS 통합 컴포넌트

**요청 프롬프트:**

```
검색바, 필터 패널, 사용자 카드 컴포넌트를 구현해주세요.
MUI 컴포넌트를 사용하되, 레이아웃은 Tailwind CSS로 구성해야 합니다.
다크모드를 지원하고, 반응형 디자인(SM/MD/LG/XL)을 적용해주세요.
```

**Claude 응답:**
주요 컴포넌트 3개 생성:

1. **SearchBar.tsx**
   - MUI `TextField`, `Button` 사용
   - Tailwind로 레이아웃 구성 (`flex`, `gap-4`)
   - 검색어 입력 시 debounce 적용

2. **FilterPanel.tsx**
   - MUI `Select`, `Checkbox`, `DatePicker` 사용
   - Tailwind Grid 레이아웃 (`grid-cols-1 md:grid-cols-2`)
   - 각 필터별 유효성 검증

3. **UserCard.tsx**
   - MUI `Card`, `Avatar`, `Typography` 사용
   - Tailwind로 카드 레이아웃 구성
   - 반응형 그리드: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

**수정/커스터마이징:**

- MUI `sx` prop과 Tailwind `className` 충돌 방지
  - MUI는 `sx`로만 스타일링
  - Tailwind는 레이아웃과 간격만 담당
- Material Design 컬러 팔레트 적용 (`primary.main`, `secondary.dark` 등)
- 다크모드에서 색상 대비 개선

**최종 코드 위치:**

```
src/presentation/components/search/SearchBar.tsx
src/presentation/components/filters/FilterPanel.tsx
src/presentation/components/user-list/UserCard.tsx
```

---

## Canvas + WebAssembly 아바타 렌더링

### Canvas API를 통한 이미지 최적화

**요청 프롬프트:**

```
HTML5 Canvas를 사용하여 사용자 아바타 이미지를 렌더링해주세요.
가능하면 WebAssembly를 통한 이미지 처리 가속도 구현해주세요.
```

**Claude 응답:**

- `useCanvasImage` 커스텀 훅 구현:

```typescript
export function useCanvasImage(imageUrl: string, size: number) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Canvas에 이미지 그리기
      // 원형 마스크 적용
    };
    img.src = imageUrl;
  }, [imageUrl, size]);

  return canvasRef;
}
```

- Canvas에 이미지 로드 후 원형 마스크 적용
- WASM 모듈 통합 예제 제공 (Rust로 이미지 필터 구현)

**수정/커스터마이징:**

- 시간 제약으로 WASM은 생략하고 Canvas만 사용
- 에러 핸들링: 이미지 로드 실패 시 폴백 이미지 표시
- CORS 문제 해결: `crossOrigin = 'anonymous'` 설정

**최종 코드 위치:**

```
src/presentation/hooks/use-canvas-image.ts
src/presentation/components/user-list/UserAvatar.tsx
```

**비고:**

- WebAssembly 구현은 시간 부족으로 미완성
- README에 해당 내용 명시

---

## 테스트 코드 작성

### Jest 유닛 테스트

**요청 프롬프트:**

```
다음 항목에 대한 Jest 유닛 테스트를 작성해주세요:
1. 검색 쿼리 빌더 (필터 조합 로직)
2. Redux slice (reducers와 actions)
3. 데이터 매퍼 함수 (API 응답 → Domain 엔티티 변환)
4. 커스텀 훅 (useInfiniteScroll)

각 테스트는 정상 케이스와 에지 케이스를 모두 포함해야 합니다.
```

**Claude 응답:**
4개의 테스트 파일 생성:

1. **build-search-query.test.ts**

```typescript
describe('buildSearchQuery', () => {
  it('should build query with type filter', () => {
    const filters = { query: 'test', type: 'user' };
    expect(buildSearchQuery(filters)).toBe('test type:user');
  });

  it('should build query with repos range', () => {
    const filters = { query: 'test', repos: { min: 10, max: 100 } };
    expect(buildSearchQuery(filters)).toBe('test repos:10..100');
  });

  // 더 많은 테스트 케이스...
});
```

2. **search-slice.test.ts**
   - Redux actions 테스트
   - Async thunks 테스트 (API 호출 mock)
   - State 변화 검증

3. **user-mapper.test.ts**
   - API 응답 → Domain 엔티티 변환 검증
   - 필드 누락 시 기본값 처리 테스트

4. **use-infinite-scroll.test.tsx**
   - Intersection Observer mock 설정
   - Callback 호출 검증
   - hasMore, loading 상태에 따른 동작 테스트

**수정/커스터마이징:**

- GitHub API mock 응답 데이터 정리 (실제 API 응답 형식과 동일하게)
- 에지 케이스 추가:
  - 빈 검색 결과
  - API 에러 응답
  - Rate Limit 초과
  - 잘못된 필터 값

**최종 코드 위치:**

```
src/application/use-cases/__tests__/build-search-query.test.ts
src/infrastructure/store/slices/__tests__/search-slice.test.ts
src/infrastructure/api/mappers/__tests__/user-mapper.test.ts
src/presentation/hooks/__tests__/use-infinite-scroll.test.tsx
```

---

### Cypress E2E 테스트

**요청 프롬프트:**

```
다음 시나리오에 대한 Cypress E2E 테스트를 작성해주세요:
1. 사용자 검색 플로우 (검색어 입력 → 결과 확인)
2. 필터 적용 및 정렬 변경
3. 무한 스크롤 동작 확인

GitHub API 호출은 intercept하여 mock 응답을 반환하도록 해주세요.
```

**Claude 응답:**
3개의 E2E 테스트 파일 생성:

1. **search.cy.ts**

```typescript
describe('User Search', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/github/search*', {
      fixture: 'search-results.json',
    }).as('searchUsers');
  });

  it('should search users and display results', () => {
    cy.visit('/');
    cy.get('[data-testid="search-input"]').type('octocat{enter}');
    cy.wait('@searchUsers');
    cy.get('[data-testid="user-card"]').should('have.length', 10);
  });
});
```

2. **filters.cy.ts**
   - 각 필터 적용 시 쿼리 변경 확인
   - 여러 필터 조합 테스트

3. **infinite-scroll.cy.ts**
   - 페이지 하단까지 스크롤
   - 추가 데이터 로드 확인
   - 로딩 인디케이터 표시 확인

**수정/커스터마이징:**

- GitHub API 호출 intercept 설정
- Mock 응답 데이터를 `cypress/fixtures/`에 저장
- 비동기 로딩 상태 대기 로직 추가 (`cy.wait`, `cy.should('be.visible')`)
- 테스트 실행 시간 단축을 위한 최적화

**최종 코드 위치:**

```
cypress/e2e/search.cy.ts
cypress/e2e/filters.cy.ts
cypress/e2e/infinite-scroll.cy.ts
cypress/fixtures/search-results.json
cypress.config.ts
```

---

## 문서화

### README.md 작성

**요청 프롬프트:**

```
프로젝트 README.md를 작성해주세요. 다음 내용을 포함해야 합니다:
1. 프로젝트 개요 및 기능 소개
2. 설치 및 실행 방법
3. 구현 스펙 체크리스트 (8가지 검색 기능)
4. MUI + Tailwind CSS 사용 시 주의사항
5. 테스트 실행 가이드
6. 기술 스택 및 아키텍처 설명
```

**Claude 응답:**
다음 섹션으로 구성된 README.md 제공:

1. **프로젝트 개요**
   - GitHub 사용자 검색 애플리케이션 소개
   - 주요 기능 요약

2. **설치 및 실행**

```bash
   # 1. 패키지 설치
   pnpm install

   # 2. 환경변수 설정
   cp .env.example .env.local
   # GITHUB_TOKEN을 입력하세요

   # 3. 개발 서버 실행
   pnpm dev
```

3. **구현 스펙 체크리스트**
   - ✅ 사용자/조직 필터 (`type:user`, `type:org`)
   - ✅ 텍스트 검색 (`in:login`, `in:name`, `in:email`)
   - ✅ 리포지토리 수 (`repos:>N`, `repos:N..M`)
   - ✅ 위치 검색 (`location:Seoul`)
   - ✅ 언어 필터 (`language:TypeScript`)
   - ✅ 가입일 검색 (`created:>2020-01-01`)
   - ✅ 팔로워 수 (`followers:>100`)
   - ✅ 후원 가능 여부 (`is:sponsorable`)

4. **MUI + Tailwind CSS 주의사항**
   - 역할 분리: MUI는 컴포넌트, Tailwind는 레이아웃
   - 충돌 방지: `important: true` 옵션 사용
   - 다크모드 동기화 방법

5. **테스트 실행**

```bash
   # Jest 유닛 테스트
   pnpm test

   # Cypress E2E 테스트
   pnpm test:e2e
```

**수정/커스터마이징:**

- 8가지 검색 기능에 대한 상세 설명 추가
- 스크린샷 placeholder 추가 (실제 이미지는 나중에 삽입)
- 아키텍처 다이어그램 추가
- 트러블슈팅 섹션 추가

**최종 코드 위치:**

```
README.md
.env.example
```

---

## 주요 기술적 결정 사항

### 1. MUI와 Tailwind CSS 통합 전략

**결정 사항:**

- **MUI**: 컴포넌트 단위 (Button, TextField, Card, Dialog 등)
- **Tailwind**: 레이아웃 및 간격 (grid, flex, spacing, margin, padding)

**충돌 방지 방법:**

```typescript
// ✅ 좋은 예: 역할 분리
<Button
  sx={{ bgcolor: 'primary.main' }}  // MUI로 컴포넌트 스타일링
  className="mt-4 w-full"            // Tailwind로 레이아웃
>
  검색
</Button>

// ❌ 나쁜 예: Tailwind로 MUI 덮어쓰기
<Button className="bg-blue-500">검색</Button>
```

**다크모드 동기화:**

```typescript
// MUI ThemeProvider와 Tailwind dark: 클래스 동기화
const theme = createTheme({
  palette: { mode: prefersDarkMode ? 'dark' : 'light' },
});

// HTML 요소에 dark 클래스 추가
document.documentElement.classList.toggle('dark', prefersDarkMode);
```

---

### 2. Redux Toolkit 상태 관리 구조

**State 구조:**

```typescript
interface SearchState {
  users: GitHubUser[]; // 검색된 사용자 목록
  filters: SearchFilters; // 현재 적용된 필터
  page: number; // 현재 페이지 번호
  totalCount: number; // 전체 결과 수
  hasMore: boolean; // 추가 로드 가능 여부
  loading: boolean; // 로딩 상태
  error: string | null; // 에러 메시지
  rateLimit: {
    // Rate Limit 정보
    remaining: number;
    reset: number;
  };
}
```

**Async Thunks:**

- `fetchUsers`: 첫 페이지 검색
- `fetchMoreUsers`: 무한 스크롤용 다음 페이지 로드

**타입 안전성:**

```typescript
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

### 3. 무한 스크롤 구현 방식

**Intersection Observer API 활용:**

```typescript
const observer = new IntersectionObserver(
  entries => {
    if (entries[0].isIntersecting && hasMore && !loading) {
      callback(); // 다음 페이지 로드
    }
  },
  { threshold: 0.1 }
);
```

**GitHub API 제한 대응:**

- 최대 1000개 결과 제한 (페이지당 100개 × 10페이지)
- 10페이지 초과 시 `hasMore = false`로 설정하여 추가 로드 중단

**중복 호출 방지:**

- 로딩 중이면 콜백 실행하지 않음
- `hasMore`가 false면 Observer detach

---

### 4. SSR + CSR 하이브리드 전략

**첫 페이지 (SSR):**

```typescript
// app/page.tsx (Server Component)
export default async function Home({ searchParams }) {
  const initialData = await fetchUsersOnServer(searchParams.q);
  return <SearchPage initialData={initialData} />;
}
```

**이후 페이지 (CSR):**

```typescript
// SearchPage.tsx (Client Component)
'use client';

export function SearchPage({ initialData }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Redux store에 초기 데이터 설정
    dispatch(setInitialData(initialData));
  }, []);

  // 무한 스크롤로 추가 데이터 로드
}
```

---

### 5. 에러 핸들링 및 사용자 경험

**Rate Limit 초과 시:**

```typescript
if (remaining === 0) {
  const resetTime = new Date(reset * 1000);
  throw new Error(`Rate limit exceeded. Resets at ${resetTime}`);
}
```

**로딩 스켈레톤 UI:**

- 초기 로딩: 카드 스켈레톤 12개 표시
- 무한 스크롤 로딩: 하단에 스피너 표시

**불필요한 콘솔 에러 제거:**

- 정상적인 완료 상태 (`hasMore = false`)는 에러로 처리하지 않음
- 개발 환경에서만 상세 로깅 출력

---

## 프로젝트 진행 중 해결한 주요 문제

### 문제 1: 무한 스크롤이 작동하지 않음

**증상:**

- 첫 페이지만 로드됨
- 스크롤해도 추가 데이터가 로드되지 않음
- 콘솔에 에러 없음

**원인 분석:**

1. API mapper에서 `total_count` 누락

```typescript
// ❌ 문제 코드
return {
  items: data.items.map(mapUser),
};

// ✅ 수정 코드
return {
  items: data.items.map(mapUser),
  total_count: data.total_count, // 추가
};
```

2. Redux slice에서 `hasMore` 계산 오류

```typescript
// ❌ 문제 코드
state.hasMore = action.payload.items.length > 0;

// ✅ 수정 코드
const currentCount = state.users.length + action.payload.items.length;
state.hasMore = currentCount < action.payload.total_count;
```

3. 컴포넌트에서 상태 변화 감지 실패
   - Redux state를 제대로 구독하지 못함
   - `useSelector`로 정확한 상태 선택 필요

**해결 방법:**

- API → Redux → UI 전체 플로우에 상세 로깅 추가
- 각 단계에서 데이터 구조 검증
- 디버깅 완료 후 로깅 제거

**교훈:**

- 무한 스크롤은 여러 레이어가 협력해야 작동하므로 전체 플로우 이해 필수
- 상세 로깅은 문제 해결에 매우 유용하지만, 완료 후 제거 필요

---

### 문제 2: MUI와 Tailwind CSS 스타일 충돌

**증상:**

- MUI 컴포넌트 기본 스타일이 제대로 적용되지 않음
- Tailwind 클래스가 MUI 스타일을 덮어씀
- 다크모드 색상이 일관되지 않음

**원인:**

- CSS 우선순위 충돌
- 다크모드 설정 불일치 (MUI와 Tailwind가 각자 관리)

**해결 방법:**

1. **Tailwind 우선순위 조정**

```typescript
// tailwind.config.ts
export default {
  important: true, // Tailwind를 MUI보다 우선
  // ...
};
```

2. **역할 명확히 분리**
   - MUI: 컴포넌트 자체 스타일링 (`sx` prop만 사용)
   - Tailwind: 레이아웃, 간격, 반응형 (`className`만 사용)

3. **다크모드 동기화**

```typescript
const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

// MUI Theme 업데이트
const theme = createTheme({
  palette: { mode: prefersDarkMode ? 'dark' : 'light' },
});

// HTML 클래스 업데이트
useEffect(() => {
  document.documentElement.classList.toggle('dark', prefersDarkMode);
}, [prefersDarkMode]);
```

**교훈:**

- 두 CSS 프레임워크를 함께 사용할 때는 명확한 역할 분리 필수
- 설정 파일에서 우선순위와 스코프를 명확히 지정해야 함

---

### 문제 3: GitHub API Rate Limit 초과

**증상:**

- 개발 중 빈번한 API 호출로 Rate Limit 초과
- `403 Forbidden` 에러 발생
- 일정 시간 동안 API 사용 불가

**원인:**

- 무한 스크롤 테스트 중 과도한 API 호출
- Rate Limit 체크 로직 부재
- 재시도 메커니즘 없음

**해결 방법:**

1. **Rate Limit 체크**

```typescript
const remaining = parseInt(
  response.headers.get('X-RateLimit-Remaining') || '0'
);
const reset = parseInt(response.headers.get('X-RateLimit-Reset') || '0');

if (remaining === 0) {
  const resetTime = new Date(reset * 1000);
  throw new RateLimitError(`Resets at ${resetTime}`);
}
```

2. **Exponential Backoff 재시도**

```typescript
async function fetchWithRetry(url: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2 ** i * 1000));
    }
  }
}
```

3. **UI에 남은 쿼터 표시**

```typescript
   <Typography variant="caption">
     API Calls Remaining: {rateLimit.remaining}
   </Typography>
```

**교훈:**

- 외부 API 사용 시 항상 Rate Limit 고려
- 재시도 로직은 필수
- 사용자에게 명확한 피드백 제공

---

## 추가로 구현한 기능 (보너스)

### 1. 정렬 옵션 4가지

**구현 내용:**

```typescript
type SortOption = 'best-match' | 'followers' | 'repositories' | 'joined';
type SortOrder = 'desc' | 'asc';

interface SortState {
  sort: SortOption;
  order: SortOrder;
}
```

**지원 정렬:**

- Best Match (기본): GitHub의 관련성 점수
- Followers: 팔로워 수 (많은 순 → 적은 순)
- Repositories: 공개 리포지토리 수 (많은 순 → 적은 순)
- Joined: 가입일 (최근 → 오래된 순)

---

### 2. 반응형 디자인

**브레이크포인트:**

- SM (640px): 1열
- MD (768px): 2열
- LG (1024px): 3열
- XL (1280px): 4열

**구현:**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {users.map(user => (
    <UserCard key={user.id} user={user} />
  ))}
</div>
```

---

### 3. 로딩 스켈레톤 UI

**초기 로딩:**

```tsx
{
  loading && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={200} />
      ))}
    </div>
  );
}
```

**무한 스크롤 로딩:**

```tsx
{
  loading && hasMore && (
    <div className="flex justify-center py-8">
      <CircularProgress />
    </div>
  );
}
```

---

### 4. 에러 경계 (Error Boundary)

**구현:**

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## 최종 체크리스트

### 필수 구현 항목

- [x] 사용자/조직 필터 (`type:user`, `type:org`)
- [x] 텍스트 검색 (`in:login`, `in:name`, `in:email`)
- [x] 리포지토리 수 (`repos:>N`, `repos:N..M`)
- [x] 위치 검색 (`location:Seoul`)
- [x] 언어 필터 (`language:TypeScript`)
- [x] 가입일 검색 (`created:>2020-01-01`, `created:2020..2023`)
- [x] 팔로워 수 (`followers:>100`, `followers:50..200`)
- [x] 후원 가능 여부 (`is:sponsorable`)

### 기술 요구사항

- [x] Next.js App Router
- [x] TypeScript (ES2023)
- [x] pnpm + Turbo
- [x] MUI + Tailwind CSS 통합
- [x] Redux Toolkit 상태 관리
- [x] SSR 첫 페이지 + CSR 무한 스크롤
- [x] 다크모드 지원
- [x] 반응형 디자인 (SM/MD/LG/XL)
- [x] Material Design 컬러 팔레트
- [x] 폰트 폴백 (SF Pro → Noto Sans)

### 테스트

- [x] Jest 유닛 테스트 (4가지 필수)
  - [x] 검색 쿼리 빌더
  - [x] Redux slice
  - [x] 데이터 매퍼
  - [x] 커스텀 훅
- [x] Cypress E2E 테스트
  - [x] 검색 플로우
  - [x] 필터 적용
  - [x] 무한 스크롤

### API 처리

- [x] 서버 라우트에서만 GitHub API 호출
- [x] Authorization token 헤더 추가
- [x] Rate Limit 처리
- [x] Exponential Backoff 재시도
- [x] UI에 남은 쿼터 표시

### 문서화

- [x] README.md
  - [x] 실행 방법
  - [x] 테스트 방법
  - [x] 구현 스펙 명세
  - [x] MUI + Tailwind CSS 주의사항
- [x] prompts/used_prompts.md
- [x] .env.example

### 코드 품질

- [x] Clean Architecture 폴더 구조
- [x] ESLint + Prettier 설정
- [x] TypeScript 엄격 모드 (`any` 사용 금지)
- [x] DRY 원칙 준수
- [x] 파일/폴더 네이밍 컨벤션
