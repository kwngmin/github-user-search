# GitHub User Search Application

> GitHub REST API 기반 사용자 검색 웹 애플리케이션

[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-7.3.6-007FFF)](https://mui.com/)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2.11.2-764ABC)](https://redux-toolkit.js.org/)
[![Jest](https://img.shields.io/badge/Jest-29.7.0-C21325)](https://jestjs.io/)
[![Cypress](https://img.shields.io/badge/Cypress-13.17.0-69D3A7)](https://www.cypress.io/)

## 📋 목차

- [프로젝트 개요](#-프로젝트-개요)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시작하기](#-시작하기)
- [테스트 실행](#-테스트-실행)
- [구현 스펙 명세](#-구현-스펙-명세)
- [프로젝트 구조](#-프로젝트-구조)
- [MUI + Tailwind CSS 사용 가이드](#-mui--tailwind-css-사용-가이드)
- [API 문서](#-api-문서)
- [개발 가이드](#-개발-가이드)

---

## 🎯 프로젝트 개요

GitHub REST API의 사용자 검색 API를 활용하여 GitHub 사용자를 검색하고 필터링할 수 있는 웹 애플리케이션입니다. Clean Architecture 패턴과 모듈화 설계를 적용했으며, 8가지 검색 필터, 무한 스크롤, 다크모드 등의 기능을 제공합니다.

### 주요 특징

- ✅ **8가지 검색 필터** - 사용자/조직, 검색 대상, 리포지토리 수, 위치, 언어, 가입일, 팔로워 수, 후원 가능 여부
- ✅ **SSR + CSR 하이브리드** - 첫 페이지는 SSR, 이후 CSR 무한 스크롤
- ✅ **반응형 디자인** - 모바일/태블릿/데스크톱 지원 (SM/MD/LG/XL)
- ✅ **다크모드** - 시스템 설정 자동 연동
- ✅ **Canvas 이미지 렌더링** - 사용자 아바타 최적화
- ✅ **Rate Limit 처리** - GitHub API 제한 대응
- ✅ **포괄적인 테스트** - Jest 165개 + Cypress 145개 테스트

---

## 🚀 주요 기능

### 1. 검색 및 필터링 (8가지)

| 번호 | 기능          | 설명                          | GitHub API 쿼리                   |
| ---- | ------------- | ----------------------------- | --------------------------------- |
| 1    | 사용자/조직   | User 또는 Organization만 검색 | `type:user` / `type:org`          |
| 2    | 검색 대상     | 계정명, 이름, 이메일에서 검색 | `in:login`, `in:name`, `in:email` |
| 3    | 리포지토리 수 | 최소/최대/범위로 필터링       | `repos:>N`, `repos:N..M`          |
| 4    | 위치          | 특정 지역 사용자 검색         | `location:Seoul`                  |
| 5    | 언어          | 프로그래밍 언어로 필터링      | `language:TypeScript`             |
| 6    | 가입일        | 날짜 범위로 필터링            | `created:>2020-01-01`             |
| 7    | 팔로워 수     | 최소/최대/범위로 필터링       | `followers:>100`                  |
| 8    | 후원 가능     | 후원 가능한 사용자만          | `is:sponsorable`                  |

### 2. 정렬 옵션 (4가지)

- **Best Match** (기본) - 관련성 순
- **Followers** - 팔로워 수 순 (DESC/ASC)
- **Repositories** - 리포지토리 수 순
- **Joined** - 가입일 순 (DESC/ASC)

### 3. 무한 스크롤

- Intersection Observer API 사용
- 페이지당 30개 결과
- 최대 1000개 결과 (GitHub API 제한)

### 4. 다크모드

- 시스템 설정 자동 감지
- 로컬 스토리지 저장
- 매끄러운 테마 전환

---

## 🛠️ 기술 스택

### Core

- **Framework**: [Next.js 16.1.1](https://nextjs.org/) (App Router)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/)
- **Package Manager**: [pnpm 10.27.0](https://pnpm.io/)
- **Build Tool**: [Turbo](https://turbo.build/)

### State & Data

- **State Management**: [Redux Toolkit 2.11.2](https://redux-toolkit.js.org/)
- **API Client**: GitHub REST API v3
- **Data Fetching**: Server Components + Client Components

### UI & Styling

- **Component Library**: [MUI (Material-UI) 7.3.6](https://mui.com/)
- **CSS Framework**: [Tailwind CSS 3.4.17](https://tailwindcss.com/)
- **Icons**: [MUI Icons](https://mui.com/material-ui/material-icons/)
- **Fonts**: SF Pro (macOS) → Noto Sans (fallback)

### Testing

- **Unit Testing**: [Jest 29.7.0](https://jestjs.io/) + [Testing Library](https://testing-library.com/)
- **E2E Testing**: [Cypress 13.17.0](https://www.cypress.io/)
- **Test Coverage**: 165 unit tests + 145 E2E tests

### Code Quality

- **Linting**: [ESLint](https://eslint.org/)
- **Formatting**: [Prettier](https://prettier.io/)
- **Type Checking**: TypeScript Strict Mode

---

## 🚀 시작하기

### 필수 요구사항

- **Node.js**: 18.18+ 또는 20.0+
- **pnpm**: 10.27.0+
- **GitHub Personal Access Token** (선택사항, Rate Limit 증가용)

### 설치 및 실행

#### 1. 저장소 클론

```bash
git clone https://github.com/kwngmin/github-user-search.git
cd github-user-search
```

#### 2. 의존성 설치

```bash
pnpm install
```

#### 3. 환경 변수 설정 (선택사항)

```bash
# .env.local 파일 생성
GITHUB_TOKEN=your_github_personal_access_token
```

> **참고**: GitHub Token 없이도 작동하지만, Rate Limit이 시간당 60회로 제한됩니다.  
> Token 사용 시 시간당 5000회까지 증가합니다.

#### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

#### 5. 프로덕션 빌드

```bash
# 빌드
pnpm build

# 프로덕션 서버 시작
pnpm start
```

---

## 🧪 테스트 실행

### Jest (Unit Tests)

#### 기본 테스트 실행

```bash
# 전체 테스트
pnpm test

# Watch 모드
pnpm test:watch

# 커버리지 리포트
pnpm test:coverage
```

#### 특정 테스트 파일 실행

```bash
# 쿼리 빌더 테스트만
pnpm test query-builder.test.ts

# API 라우트 테스트만
pnpm test api-route.test.ts
```

#### 테스트 통계

```
Test Suites: 5 passed, 5 total
Tests:       165 passed, 165 total

- example.test.ts: 1개
- api-route.test.ts: 36개
- query-builder.test.ts: 57개
- search-users.test.ts: 30개
- user-card.test.tsx: 41개
```

---

### Cypress (E2E Tests)

#### GUI 모드 (개발 중)

```bash
pnpm test:e2e
```

Cypress Test Runner가 열리면 테스트 파일을 선택하여 브라우저에서 실행

#### Headless 모드 (CI/CD)

```bash
# 전체 E2E 테스트
pnpm test:e2e:headless

# 특정 테스트만
pnpm cypress run --spec "cypress/e2e/01-search.cy.ts"

# Chrome 브라우저
pnpm cypress run --browser chrome
```

#### 테스트 파일 목록

```
cypress/e2e/
├── 01-search.cy.ts          # 검색 기능 (25 tests)
├── 02-filters.cy.ts         # 필터 기능 (35 tests)
├── 03-infinite-scroll.cy.ts # 무한 스크롤 (25 tests)
├── 04-dark-mode.cy.ts       # 다크모드 (30 tests)
└── 05-sorting.cy.ts         # 정렬 기능 (30 tests)

Total: 145 E2E tests
```

---

## ✅ 구현 스펙 명세

### 필수 기능 체크리스트

#### 검색 필터 (8가지)

- [x] **1. 사용자/조직 필터** - `type:user` / `type:org`
  - User만 검색
  - Organization만 검색
  - 전체 검색 (기본)

- [x] **2. 검색 대상 필드** - `in:login`, `in:name`, `in:email`
  - 계정명(login)에서 검색
  - 이름(name)에서 검색
  - 이메일(email)에서 검색
  - 복수 선택 가능

- [x] **3. 리포지토리 수** - `repos:>=N`, `repos:N..M`
  - 최소값 이상 (`repos:>=10`)
  - 최대값 이하 (`repos:<=100`)
  - 범위 지정 (`repos:10..100`)
  - 정확한 값 (`repos:42`)

- [x] **4. 위치** - `location:Seoul`
  - 단일 단어 위치
  - 공백 포함 위치 (따옴표 처리)
  - 대소문자 구분 없음

- [x] **5. 프로그래밍 언어** - `language:TypeScript`
  - 언어 이름으로 검색
  - 공백 포함 언어 지원

- [x] **6. 가입일** - `created:>=2020-01-01`, `created:2020..2023`
  - 시작일 이후 (`created:>=2020-01-01`)
  - 종료일 이전 (`created:<=2023-12-31`)
  - 날짜 범위 (`created:2020-01-01..2023-12-31`)
  - 정확한 날짜 (`created:2022-06-15`)

- [x] **7. 팔로워 수** - `followers:>=100`, `followers:50..200`
  - 최소값 이상
  - 최대값 이하
  - 범위 지정
  - 정확한 값

- [x] **8. 후원 가능 여부** - `is:sponsorable`
  - 후원 가능한 사용자만 필터링
  - 체크박스로 토글

#### 정렬 기능 (4가지)

- [x] **Best Match** - 관련성 순 (기본)
- [x] **Followers** - 팔로워 수 순 (DESC/ASC)
- [x] **Repositories** - 리포지토리 수 순
- [x] **Joined** - 가입일 순 (DESC/ASC)

#### 페이징 & 무한 스크롤

- [x] **SSR 첫 페이지** - 서버 사이드 렌더링
- [x] **CSR 무한 스크롤** - Intersection Observer
- [x] **페이지당 30개 결과**
- [x] **최대 1000개 제한** - GitHub API 제한 대응

#### UI/UX

- [x] **시스템 다크모드 연동** - 자동 감지 및 토글
- [x] **반응형 디자인** - SM(640px) / MD(768px) / LG(1024px) / XL(1280px)
- [x] **Material Design 컬러 팔레트**
- [x] **폰트 폴백** - SF Pro → Noto Sans
- [x] **Canvas 이미지 렌더링** - 아바타 최적화

#### 성능 최적화

- [x] **Server Components** - 초기 로딩 최적화
- [x] **Code Splitting** - 동적 임포트
- [x] **이미지 최적화** - Canvas + Lazy Loading

#### API 처리

- [x] **서버 라우트 전용** - 모든 GitHub API 호출은 `/api/*`에서만
- [x] **Authorization 헤더** - GitHub Token 사용
- [x] **Rate Limit 처리** - 헤더 확인 및 Exponential Backoff
- [x] **에러 핸들링** - 적절한 에러 메시지 및 상태 코드

#### 테스트

- [x] **Jest 유닛 테스트** - 165개
  - 검색 로직 (query-builder)
  - 유즈케이스 (search-users)
  - API 라우트 (api-route)
  - 컴포넌트 (user-card)

- [x] **Cypress E2E 테스트** - 145개
  - 검색 기능
  - 필터 적용
  - 무한 스크롤
  - 다크모드
  - 정렬 변경

---

## 📁 프로젝트 구조

```
github-user-search/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   └── search/
│   │   │       └── users/
│   │   │           └── route.ts  # POST /api/search/users
│   │   ├── layout.tsx            # Root Layout (Providers)
│   │   └── page.tsx              # Home Page (Server Component)
│   │
│   ├── domain/                   # 도메인 레이어 (비즈니스 로직)
│   │   ├── entities/             # 엔티티
│   │   │   └── user.ts           # GitHubUser 인터페이스
│   │   └── types/                # 도메인 타입
│   │       └── filters.ts        # SearchFilters 타입
│   │
│   ├── application/              # 애플리케이션 레이어 (유즈케이스)
│   │   └── use-cases/
│   │       ├── query-builder.ts  # 검색 쿼리 빌더
│   │       └── search-users.ts   # 사용자 검색 유즈케이스
│   │
│   ├── infrastructure/           # 인프라 레이어 (외부 API)
│   │   ├── api/
│   │   │   ├── github-api.ts     # GitHub API 클라이언트
│   │   │   └── mappers/          # DTO → Entity 변환
│   │   │       └── user-mapper.ts
│   │   └── lib/
│   │       └── github-api-client.ts
│   │
│   ├── presentation/             # 프레젠테이션 레이어 (UI)
│   │   ├── components/           # UI 컴포넌트
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── FilterPanel.tsx
│   │   │   ├── results/
│   │   │   │   ├── UserList.tsx
│   │   │   │   └── UserCard.tsx
│   │   │   └── common/
│   │   │       ├── Header.tsx
│   │   │       └── ThemeToggle.tsx
│   │   │
│   │   └── providers/            # Context Providers
│   │       ├── ReduxProvider.tsx
│   │       └── ThemeProvider.tsx
│   │
│   └── store/                    # Redux Store
│       ├── index.ts              # Store 설정
│       └── slices/
│           └── searchSlice.ts    # 검색 상태 관리
│
├── __tests__/                    # Jest 테스트
│   ├── api/
│   │   └── api-route.test.ts     # API 라우트 테스트 (36)
│   ├── application/
│   │   └── use-cases/
│   │       ├── query-builder.test.ts   # 쿼리 빌더 (57)
│   │       └── search-users.test.ts    # 유즈케이스 (30)
│   └── presentation/
│       └── components/
│           └── user-card.test.tsx      # 컴포넌트 (41)
│
├── cypress/                      # Cypress E2E 테스트
│   ├── e2e/
│   │   ├── 01-search.cy.ts       # 검색 (25)
│   │   ├── 02-filters.cy.ts      # 필터 (35)
│   │   ├── 03-infinite-scroll.cy.ts  # 스크롤 (25)
│   │   ├── 04-dark-mode.cy.ts    # 다크모드 (30)
│   │   └── 05-sorting.cy.ts      # 정렬 (30)
│   └── support/
│       ├── commands.ts           # 커스텀 커맨드
│       └── e2e.ts                # 전역 설정
│
├── public/                       # 정적 파일
├── prompts/                      # AI 프롬프트 기록
│   └── used_prompts.md          # 사용한 프롬프트 전체
│
├── jest.config.js               # Jest 설정
├── jest.setup.ts                # Jest 전역 설정
├── cypress.config.ts            # Cypress 설정
├── next.config.js               # Next.js 설정
├── tailwind.config.ts           # Tailwind CSS 설정
├── tsconfig.json                # TypeScript 설정
└── turbo.json                   # Turbo 설정
```

### 아키텍처 레이어 설명

#### 1. Domain Layer (도메인 레이어)

- **역할**: 비즈니스 엔티티 및 도메인 규칙
- **의존성**: 없음 (가장 독립적)
- **파일**: `entities/`, `types/`

#### 2. Application Layer (애플리케이션 레이어)

- **역할**: 유즈케이스 및 비즈니스 로직
- **의존성**: Domain Layer만 의존
- **파일**: `use-cases/`

#### 3. Infrastructure Layer (인프라 레이어)

- **역할**: 외부 시스템 연동 (API, DB 등)
- **의존성**: Domain, Application 의존
- **파일**: `api/`, `mappers/`

#### 4. Presentation Layer (프레젠테이션 레이어)

- **역할**: UI 컴포넌트 및 사용자 인터랙션
- **의존성**: 모든 레이어 사용 가능
- **파일**: `components/`, `providers/`

---

## 🎨 MUI + Tailwind CSS 사용 가이드

### 역할 분리 원칙

MUI와 Tailwind CSS를 함께 사용할 때는 **명확한 역할 분리**가 중요합니다.

| 구분         | 담당              | 사용 예시                                  |
| ------------ | ----------------- | ------------------------------------------ |
| **MUI**      | UI 컴포넌트       | Button, TextField, Card, Dialog, Chip      |
| **Tailwind** | 레이아웃 & 스타일 | Grid, Flexbox, Spacing, Colors, Responsive |

### ✅ Good Practices

#### 1. MUI 컴포넌트 + Tailwind 레이아웃

```tsx
// ✅ Good: MUI 컴포넌트 + Tailwind 레이아웃
<Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
  <Card>
    <CardContent>
      <Typography variant="h6">제목</Typography>
      <Button variant="contained">버튼</Button>
    </CardContent>
  </Card>
</Box>
```

#### 2. MUI sx prop + Tailwind className 분리

```tsx
// ✅ Good: 역할 분리
<Button
  sx={{
    bgcolor: 'primary.main',
    '&:hover': { bgcolor: 'primary.dark' },
  }}
  className="mt-4 w-full"
>
  검색
</Button>
```

#### 3. Tailwind로 반응형 레이아웃

```tsx
// ✅ Good: Tailwind 반응형
<div className="flex flex-col lg:flex-row gap-4">
  <aside className="w-full lg:w-64">{/* 필터 패널 */}</aside>
  <main className="flex-1">{/* 검색 결과 */}</main>
</div>
```

### ❌ Bad Practices

#### 1. Tailwind로 MUI 스타일 덮어쓰기

```tsx
// ❌ Bad: Tailwind로 MUI 버튼 색상 변경
<Button className="bg-blue-500 hover:bg-blue-700">
  검색
</Button>

// ✅ Good: MUI variant 또는 sx 사용
<Button variant="contained" color="primary">
  검색
</Button>
```

#### 2. MUI만으로 복잡한 레이아웃

```tsx
// ❌ Bad: MUI Grid로 복잡한 레이아웃
<Grid container spacing={2}>
  <Grid item xs={12} md={6} lg={4}>
    <Card>...</Card>
  </Grid>
</Grid>

// ✅ Good: Tailwind Grid 사용
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
</div>
```

#### 3. 중복된 스타일링

```tsx
// ❌ Bad: MUI와 Tailwind 중복
<Box sx={{ margin: 2 }} className="m-8">
  {/* 충돌 발생 */}
</Box>

// ✅ Good: 하나만 선택
<Box className="m-8">
  {/* Tailwind만 */}
</Box>
```

### 다크모드 처리

#### MUI Theme + Tailwind dark: 동기화

```tsx
// ThemeProvider.tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: isDarkMode ? 'dark' : 'light',
  },
});

// HTML에 dark 클래스 토글
useEffect(() => {
  if (isDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [isDarkMode]);
```

#### Tailwind dark: 클래스 사용

```tsx
// ✅ Good: Tailwind dark 모드
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  {/* 다크모드 대응 */}
</div>
```

### 권장 사항 요약

| 상황                   | 사용 도구         | 이유                    |
| ---------------------- | ----------------- | ----------------------- |
| 버튼, 인풋, 다이얼로그 | MUI               | 일관된 디자인 시스템    |
| 그리드, 플렉스박스     | Tailwind          | 간결하고 빠른 레이아웃  |
| 컬러, 타이포그래피     | MUI Theme         | Material Design 가이드  |
| 간격, 여백             | Tailwind          | 유틸리티 클래스         |
| 반응형 디자인          | Tailwind          | 직관적인 브레이크포인트 |
| 애니메이션             | MUI 또는 Tailwind | 상황에 따라 선택        |

---

## 📡 API 문서

### POST /api/search/users

GitHub 사용자 검색 API

#### Request Body

```typescript
{
  query: string;              // 검색어 (필수)
  type?: 'user' | 'org';     // 사용자/조직 필터
  searchIn?: Array<'login' | 'name' | 'email'>;
  repos?: {
    min?: number;
    max?: number;
    exact?: number;
  };
  location?: string;          // 위치
  language?: string;          // 언어
  created?: {
    from?: string;            // ISO 날짜
    to?: string;
    exact?: string;
  };
  followers?: {
    min?: number;
    max?: number;
    exact?: number;
  };
  isSponsored?: boolean;      // 후원 가능 여부
  sort?: 'best-match' | 'followers' | 'repositories' | 'joined';
  sortOrder?: 'asc' | 'desc';
  page?: number;              // 페이지 번호
  perPage?: number;           // 페이지당 결과 수
}
```

#### Response

```typescript
{
  users: Array<{
    id: number;
    login: string;
    name: string | null;
    type: 'User' | 'Organization';
    avatarUrl: string;
    htmlUrl: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    email: string | null;
    blog: string | null;
    publicRepos: number;
    publicGists: number;
    followers: number;
    following: number;
    createdAt: string;
    updatedAt: string;
    isSponsored?: boolean;
  }>;
  metadata: {
    totalCount: number;
    page: number;
    perPage: number;
    incompleteResults: boolean;
  }
  rateLimit: {
    limit: number;
    remaining: number;
    reset: string;
  }
}
```

#### 예시

```bash
curl -X POST http://localhost:3000/api/search/users \
  -H "Content-Type: application/json" \
  -d '{
    "query": "developer",
    "type": "user",
    "location": "Seoul",
    "language": "TypeScript",
    "repos": { "min": 10 },
    "followers": { "min": 100 },
    "sort": "followers",
    "sortOrder": "desc",
    "page": 1,
    "perPage": 30
  }'
```

---

## 🔧 개발 가이드

### 환경 변수

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token

# 선택사항
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 코딩 컨벤션

#### 파일명

- **컴포넌트**: PascalCase (예: `UserCard.tsx`)
- **함수/유틸**: kebab-case (예: `query-builder.ts`)
- **폴더**: kebab-case (예: `use-cases/`)

#### 원칙

- **DRY** (Don't Repeat Yourself)
- **any 사용 금지** - 명시적 타입 지정
- **주석**: 코드 이해를 돕는 주석은 유지
- **최신 React**: Deprecated 기능 사용 금지

### 스크립트

```bash
# 개발
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm start            # 프로덕션 서버

# 테스트
pnpm test             # Jest 테스트
pnpm test:watch       # Jest watch 모드
pnpm test:coverage    # 커버리지 리포트
pnpm test:e2e         # Cypress GUI
pnpm test:e2e:headless # Cypress headless

# 코드 품질
pnpm lint             # ESLint 검사
pnpm lint:fix         # ESLint 자동 수정
pnpm format           # Prettier 포맷팅

# Turbo
pnpm turbo:dev        # Turbo로 개발 서버
pnpm turbo:build      # Turbo로 빌드
pnpm turbo:test       # Turbo로 테스트
```

### Git 워크플로우

```bash
# 브랜치 생성
git checkout -b feature/search-filters

# 커밋
git add .
git commit -m "feat: Add location filter"

# 푸시
git push origin feature/search-filters
```

---

## 📚 참고 문서

- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub REST API](https://docs.github.com/en/rest/search/search#search-users)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [MUI Components](https://mui.com/material-ui/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [Cypress E2E](https://docs.cypress.io/)

---

## 📝 라이센스

This project is private and proprietary.

---

## 👤 작성자

**광민 (Kwngmin)**
