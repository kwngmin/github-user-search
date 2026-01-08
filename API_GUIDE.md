# GitHub Search API 라우트 가이드

## 📡 API 엔드포인트

### 1. 사용자 검색 API

**POST** `/api/search/users`

GitHub 사용자를 검색합니다.

#### Request Body

```typescript
{
  query: string;              // 검색어 (필수)
  type?: 'user' | 'org';      // 사용자 타입
  searchIn?: Array<'login' | 'name' | 'email'>;
  repos?: {                   // 리포지토리 수
    min?: number;
    max?: number;
    exact?: number;
  };
  location?: string;          // 위치
  language?: string;          // 언어
  created?: {                 // 가입일
    from?: string;            // YYYY-MM-DD
    to?: string;
  };
  followers?: {               // 팔로워 수
    min?: number;
    max?: number;
    exact?: number;
  };
  isSponsored?: boolean;      // 후원 가능 여부
  sort?: 'best-match' | 'followers' | 'repositories' | 'joined';
  sortOrder?: 'asc' | 'desc';
  page?: number;              // 페이지 번호 (1부터 시작)
  perPage?: number;           // 페이지당 결과 수 (1-100)
}
```

#### Response (Success - 200)

```typescript
{
  users: Array<{
    id: number;
    login: string;
    avatarUrl: string;
    htmlUrl: string;
    type: 'User' | 'Organization';
    name: string | null;
    company: string | null;
    blog: string | null;
    location: string | null;
    email: string | null;
    bio: string | null;
    publicRepos: number;
    publicGists: number;
    followers: number;
    following: number;
    createdAt: string;
    updatedAt: string;
  }>;
  metadata: {
    totalCount: number;
    incompleteResults: boolean;
    currentPage: number;
    perPage: number;
    hasNextPage: boolean;
  }
}
```

#### Response (Error)

```typescript
{
  error: string;      // 에러 메시지
  code?: string;      // 에러 코드
}
```

#### 에러 코드

- `MISSING_QUERY`: 검색어가 없음 (400)
- `QUERY_TOO_LONG`: 검색어가 너무 김 (400)
- `INVALID_PAGE`: 잘못된 페이지 번호 (400)
- `PAGE_TOO_HIGH`: 페이지 번호가 너무 높음 (400)
- `INVALID_PER_PAGE`: 잘못된 perPage 값 (400)
- `INVALID_RANGE`: 잘못된 범위 필터 (400)
- `INVALID_DATE_FORMAT`: 잘못된 날짜 형식 (400)
- `AUTHENTICATION_FAILED`: GitHub 인증 실패 (401)
- `RATE_LIMIT_EXCEEDED`: Rate Limit 초과 (429)
- `GITHUB_API_ERROR`: GitHub API 에러 (다양)

#### 사용 예시

```typescript
// 기본 검색
const response = await fetch('/api/search/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'react',
    page: 1,
    perPage: 30,
  }),
});

// 복합 필터 검색
const response = await fetch('/api/search/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'javascript developer',
    type: 'user',
    location: 'Seoul',
    language: 'TypeScript',
    repos: { min: 10 },
    followers: { min: 100, max: 500 },
    created: { from: '2020-01-01' },
    sort: 'followers',
    sortOrder: 'desc',
  }),
});
```

---

### 2. Rate Limit 조회 API

**GET** `/api/rate-limit`

현재 GitHub API Rate Limit 상태를 조회합니다.

#### Response (Success - 200)

```typescript
{
  limit: number; // 시간당 최대 요청 수
  remaining: number; // 남은 요청 수
  reset: number; // 리셋 시간 (Unix timestamp)
  used: number; // 사용한 요청 수
}
```

#### 사용 예시

```typescript
const response = await fetch('/api/rate-limit');
const rateLimit = await response.json();

console.log(`남은 요청: ${rateLimit.remaining}/${rateLimit.limit}`);
console.log(`리셋 시간: ${new Date(rateLimit.reset * 1000)}`);
```

---

## 🔧 서버 설정

### 환경변수 설정

`.env.local` 파일에 GitHub Token을 설정하세요:

```bash
# GitHub Personal Access Token
GITHUB_TOKEN=ghp_your_token_here
```

#### GitHub Token 생성 방법

1. GitHub 설정 페이지 접속: https://github.com/settings/tokens
2. "Generate new token" 클릭
3. 권한 선택:
   - `public_repo` (공개 리포지토리 접근)
   - `read:user` (사용자 정보 읽기)
4. 생성된 토큰을 `.env.local`에 저장

---

## 🚀 주요 기능

### 1. Authorization Token

모든 GitHub API 요청에 자동으로 토큰이 포함됩니다:

```typescript
headers: {
  'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
}
```

### 2. Rate Limit 처리

#### Exponential Backoff 재시도

Rate Limit 초과 시 자동으로 재시도합니다:

```typescript
// 재시도 설정
maxRetries: 3
baseDelay: 1000ms
maxDelay: 10000ms
```

#### 딜레이 계산

```typescript
delay = min(baseDelay * 2^retryCount, maxDelay) ± 20% jitter
```

#### Rate Limit Reset 시간 대기

Rate Limit이 초과되면 reset 시간까지 자동으로 대기합니다.

### 3. 에러 핸들링

#### ApiError 클래스

모든 에러는 `ApiError`로 통일:

```typescript
class ApiError extends Error {
  constructor(message: string, statusCode: number, code?: string);
}
```

#### 에러 응답 형식

```typescript
{
  error: "Rate limit exceeded. Resets at 2024-01-08 15:30:00",
  code: "RATE_LIMIT_EXCEEDED"
}
```

### 4. 입력 검증

모든 요청 파라미터는 서버에서 검증됩니다:

- 검색어: 필수, 최대 256자
- 페이지: 양의 정수, GitHub API 제한 (max 1000 결과)
- perPage: 1-100 사이 정수
- 범위 필터: min ≤ max
- 날짜: YYYY-MM-DD 형식

---

## 🧪 테스트

### cURL로 테스트

```bash
# 기본 검색
curl -X POST http://localhost:3000/api/search/users \
  -H "Content-Type: application/json" \
  -d '{"query":"react","page":1,"perPage":10}'

# Rate Limit 조회
curl http://localhost:3000/api/rate-limit
```

### Postman Collection

```json
{
  "info": {
    "name": "GitHub User Search API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Search Users",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"query\": \"react\",\n  \"type\": \"user\",\n  \"location\": \"Seoul\",\n  \"page\": 1,\n  \"perPage\": 30\n}"
        },
        "url": {
          "raw": "http://localhost:3000/api/search/users",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "search", "users"]
        }
      }
    },
    {
      "name": "Get Rate Limit",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:3000/api/rate-limit",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "rate-limit"]
        }
      }
    }
  ]
}
```

---

## 🔍 디버깅

### 로그 확인

서버 로그에서 API 호출 정보를 확인할 수 있습니다:

```bash
[GitHub API] Rate limit exceeded. Retrying in 2000ms...
[GitHub API] Request failed. Retrying in 1000ms...
[API /api/search/users] Error: Rate limit exceeded and max retries reached
```

### 환경변수 확인

```bash
# .env.local이 제대로 로드되었는지 확인
node -e "console.log(process.env.GITHUB_TOKEN)"
```

---

## 📊 Rate Limit 정보

### GitHub API Rate Limit

- **인증된 요청**: 5,000 requests/hour
- **인증되지 않은 요청**: 60 requests/hour
- **검색 API**: 30 requests/minute

### Rate Limit 헤더

GitHub API 응답에 포함되는 헤더:

```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset: 1704711000
X-RateLimit-Used: 1
```

---

## ⚠️ 주의사항

1. **GitHub Token 보안**
   - `.env.local`은 절대 Git에 커밋하지 마세요
   - `.gitignore`에 `.env.local` 포함 확인

2. **Rate Limit 관리**
   - Rate Limit이 낮으면 검색 빈도를 줄이세요
   - 프로덕션에서는 여러 토큰 로테이션 고려

3. **에러 처리**
   - 모든 API 호출은 try-catch로 감싸세요
   - 사용자에게 적절한 에러 메시지 표시

4. **캐싱**
   - 현재는 캐싱 없음 (`cache: 'no-store'`)
   - 필요 시 Next.js의 `revalidate` 옵션 사용

---

**참고**: 이 API는 GitHub REST API v3를 사용합니다.

- 공식 문서: https://docs.github.com/en/rest/search
