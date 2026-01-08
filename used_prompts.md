# GitHub User Search - 사용한 프롬프트 기록

## Day 1: Clean Architecture 기반 구조 설계

### 1단계: 프로젝트 구조 설계

#### 요청 프롬프트:
```
"GitHub 사용자 검색 앱을 Clean Architecture로 구현하려고 해.
폴더 구조와 각 레이어의 역할, 파일 예시 코드 만들어줘."
```

#### Claude 응답:
Clean Architecture 4개 레이어로 구조 설계:
1. **Domain Layer**: 비즈니스 엔티티 및 인터페이스
   - `domain/entities/user.ts`: GitHubUser, SearchResult, RateLimit
   - `domain/types/filters.ts`: 8가지 검색 필터 타입
   - `domain/repositories/user-repository.interface.ts`: 리포지토리 인터페이스

2. **Application Layer**: 유즈케이스 및 비즈니스 로직
   - `application/use-cases/search-users.ts`: 검색 유즈케이스, 입력 검증
   - `application/use-cases/query-builder.ts`: GitHub API 쿼리 빌더

3. **Infrastructure Layer**: 외부 API 구현
   - `infrastructure/api/github-types.ts`: GitHub API 응답 타입
   - `infrastructure/api/github-mapper.ts`: API → Domain 변환
   - `infrastructure/api/github-api.ts`: UserRepository 구현체, Rate Limit 처리

4. **Presentation Layer**: UI 및 상태 관리
   - `presentation/store/`: Redux Toolkit 설정
   - `presentation/components/`: React 컴포넌트

#### 생성된 주요 파일:
- `src/domain/entities/user.ts`
- `src/domain/types/filters.ts`
- `src/domain/repositories/user-repository.interface.ts`
- `src/application/use-cases/search-users.ts`
- `src/application/use-cases/query-builder.ts`
- `src/infrastructure/api/github-types.ts`
- `src/infrastructure/api/github-mapper.ts`
- `src/infrastructure/api/github-api.ts`
- `src/presentation/store/index.ts`
- `src/presentation/store/search-slice.ts`
- `src/presentation/components/SearchBar.tsx`
- `src/presentation/components/UserCard.tsx`

#### 수정/커스터마이징:
없음 - 초기 생성 단계

#### 최종 코드 위치:
`/home/claude/github-user-search/src/` 전체 구조

---

## 구현 특징

### 1. 8가지 검색 기능 타입 정의 (`domain/types/filters.ts`)
```typescript
export interface SearchFilters {
  query: string;                    // 기본 검색어
  type?: UserType;                  // 1. 사용자/조직 필터
  searchIn?: SearchInField[];       // 2. 계정명/이름/이메일 검색
  repos?: RangeFilter;              // 3. 리포지토리 수
  location?: string;                // 4. 위치
  language?: string;                // 5. 언어
  created?: DateRangeFilter;        // 6. 가입일
  followers?: RangeFilter;          // 7. 팔로워 수
  isSponsored?: boolean;            // 8. 후원 가능 여부
  sort?: SortOption;                // 정렬
  sortOrder?: SortOrder;            // 정렬 순서
}
```

### 2. Query Builder 로직 (`application/use-cases/query-builder.ts`)
- 8가지 필터를 GitHub API 쿼리 문자열로 변환
- 예시: `"react type:user location:Seoul repos:>10 followers:100..500"`

### 3. Rate Limit 처리 (`infrastructure/api/github-api.ts`)
- Exponential Backoff 재시도 로직
- `X-RateLimit-Remaining` 헤더 체크
- Rate Limit 초과 시 자동 재시도

### 4. Redux Toolkit 상태 관리 (`presentation/store/search-slice.ts`)
- 비동기 액션: `searchUsers`, `fetchRateLimit`
- 무한 스크롤 지원: 페이지 추가 시 기존 데이터에 append

---

## 다음 단계 예정 프롬프트

### Day 1 남은 작업:
1. "Next.js 프로젝트 초기 세팅 (package.json, tsconfig, next.config) 해줘"
2. "MUI + Tailwind CSS 설정 및 다크모드 지원 구현해줘"
3. "서버 라우트 /api/search 구현해줘 (GitHub API 호출)"
4. "필터 패널 컴포넌트 만들어줘 (8가지 필터 UI)"

### Day 2 예정:
1. "SSR 첫 페이지 렌더링 구현해줘"
2. "CSR 무한 스크롤 (Intersection Observer) 구현해줘"
3. "Canvas + WebAssembly 아바타 렌더링 구현해줘"
4. "Rate Limit UI 표시 컴포넌트 만들어줘"

### Day 3 예정:
1. "Jest 유닛 테스트 작성해줘 (query-builder, mapper 등)"
2. "Cypress E2E 테스트 작성해줘"
3. "README.md 작성해줘 (실행 방법, 스펙 명세)"

---

**노트**: 
- 모든 코드는 TypeScript strict 모드 준수
- `any` 타입 사용 금지
- DRY 원칙 적용
- 파일명: 컴포넌트 PascalCase, 함수/유틸 kebab-case
- 폴더명: kebab-case
