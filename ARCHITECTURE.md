# GitHub User Search - Clean Architecture 구조

## 📁 프로젝트 구조

```
src/
├── domain/                      # 도메인 레이어 (비즈니스 엔티티)
│   ├── entities/
│   │   └── user.ts             # GitHubUser, SearchResult, RateLimit 엔티티
│   ├── repositories/
│   │   └── user-repository.interface.ts  # 리포지토리 인터페이스
│   └── types/
│       └── filters.ts          # SearchFilters, 검색 타입 정의
│
├── application/                 # 애플리케이션 레이어 (유즈케이스)
│   └── use-cases/
│       ├── search-users.ts     # 사용자 검색 유즈케이스
│       └── query-builder.ts    # 검색 쿼리 빌더
│
├── infrastructure/              # 인프라 레이어 (외부 API)
│   └── api/
│       ├── github-types.ts     # GitHub API 응답 타입
│       ├── github-mapper.ts    # API → Domain 변환 매퍼
│       └── github-api.ts       # GitHub API 구현체
│
└── presentation/                # 프레젠테이션 레이어 (UI)
    ├── components/
    │   ├── SearchBar.tsx       # 검색바 컴포넌트
    │   └── UserCard.tsx        # 사용자 카드 컴포넌트
    ├── pages/
    └── store/
        ├── index.ts            # Redux Store 설정
        └── search-slice.ts     # 검색 상태 관리 슬라이스
```

## 🏗️ Clean Architecture 레이어 설명

### 1. Domain Layer (도메인 레이어)
**역할**: 비즈니스 핵심 로직과 엔티티 정의
**의존성**: 다른 레이어에 의존하지 않음 (가장 독립적)

**주요 파일**:
- `domain/entities/user.ts`: GitHubUser, SearchResult 등 핵심 엔티티
- `domain/types/filters.ts`: 8가지 검색 필터 타입 정의
- `domain/repositories/user-repository.interface.ts`: 리포지토리 추상 인터페이스

**특징**:
- 순수한 TypeScript 타입/인터페이스
- 외부 라이브러리 의존성 없음
- 비즈니스 규칙만 포함

### 2. Application Layer (애플리케이션 레이어)
**역할**: 유즈케이스 구현 및 비즈니스 로직 조율
**의존성**: Domain Layer만 의존

**주요 파일**:
- `application/use-cases/search-users.ts`: 검색 유즈케이스 (입력 검증, 필터 정규화)
- `application/use-cases/query-builder.ts`: GitHub API 쿼리 문자열 생성

**특징**:
- Domain 엔티티를 사용하여 비즈니스 로직 구현
- Infrastructure 구현체는 인터페이스를 통해서만 접근

### 3. Infrastructure Layer (인프라 레이어)
**역할**: 외부 API, 데이터베이스 등 구체적인 구현
**의존성**: Domain, Application Layer 의존

**주요 파일**:
- `infrastructure/api/github-api.ts`: UserRepository 인터페이스 구현
- `infrastructure/api/github-mapper.ts`: API 응답 → Domain 엔티티 변환
- `infrastructure/api/github-types.ts`: GitHub API 응답 타입

**특징**:
- GitHub REST API 실제 호출
- Rate Limit 처리 및 Exponential Backoff
- Domain 인터페이스 구현 (Dependency Inversion)

### 4. Presentation Layer (프레젠테이션 레이어)
**역할**: UI 컴포넌트 및 상태 관리
**의존성**: 모든 레이어 의존 가능

**주요 파일**:
- `presentation/store/`: Redux Toolkit 상태 관리
- `presentation/components/`: React 컴포넌트
- `presentation/pages/`: Next.js 페이지

**특징**:
- MUI 컴포넌트 사용
- Tailwind CSS로 레이아웃 구성
- Redux로 전역 상태 관리

## 🔄 데이터 흐름

```
사용자 입력 (UI)
    ↓
Redux Action (Presentation)
    ↓
UseCase (Application)
    ↓
Repository Interface (Domain)
    ↓
GitHub API Implementation (Infrastructure)
    ↓
API Response → Domain Entity (Mapper)
    ↓
Redux State 업데이트 (Presentation)
    ↓
UI 렌더링
```

## 💡 핵심 설계 원칙

### 1. Dependency Inversion (의존성 역전)
```typescript
// Domain에서 인터페이스 정의
interface UserRepository {
  searchUsers(filters: SearchFilters): Promise<SearchResult>;
}

// Infrastructure에서 구현
class GitHubApiRepository implements UserRepository {
  // 실제 구현...
}
```

### 2. Single Responsibility (단일 책임)
- 각 레이어는 하나의 명확한 책임만 가짐
- 변경 사유가 하나만 존재

### 3. Separation of Concerns (관심사 분리)
- API 구조 변경 → Infrastructure Layer만 수정
- 비즈니스 로직 변경 → Application Layer만 수정
- UI 변경 → Presentation Layer만 수정

## 🧪 테스트 전략

### Domain Layer
- 순수 함수 테스트 (입력 → 출력)
- 비즈니스 규칙 검증

### Application Layer
- UseCase 로직 테스트
- Mock Repository로 격리 테스트

### Infrastructure Layer
- API 호출 통합 테스트
- Mapper 변환 테스트

### Presentation Layer
- 컴포넌트 렌더링 테스트
- Redux 상태 변화 테스트
- E2E 테스트 (Cypress)

## 📝 사용 예시

### 1. 새로운 검색 필터 추가
```typescript
// Step 1: Domain에 타입 추가
export interface SearchFilters {
  // ... 기존 필터
  newFilter?: string;
}

// Step 2: Application에 쿼리 빌더 로직 추가
if (filters.newFilter) {
  queryParts.push(`new:${filters.newFilter}`);
}

// Step 3: Presentation에 UI 컴포넌트 추가
<TextField
  value={newFilter}
  onChange={(e) => setNewFilter(e.target.value)}
/>
```

### 2. 다른 API로 교체
```typescript
// Infrastructure Layer만 수정
class NewApiRepository implements UserRepository {
  async searchUsers(filters: SearchFilters): Promise<SearchResult> {
    // 새로운 API 호출 로직
  }
}

// 다른 레이어는 변경 불필요!
```

## ✅ Clean Architecture의 장점

1. **테스트 용이성**: 각 레이어를 독립적으로 테스트
2. **유지보수성**: 변경 영향 범위 최소화
3. **확장성**: 새로운 기능 추가 시 구조 유지
4. **독립성**: 프레임워크/라이브러리 교체 용이

## 🚀 다음 단계

1. Next.js App Router 통합
2. 서버 라우트(`/api/*`) 구현
3. SSR 첫 페이지 렌더링
4. 무한 스크롤 구현
5. Canvas + WebAssembly 아바타 렌더링
6. 테스트 코드 작성

---

**참고**: 이 구조는 과제 요구사항에 맞춰 단순화되었지만, 실제 프로덕션에서는 더 세밀한 레이어 분리가 필요할 수 있습니다.
