# GitHub Search Query Builder 가이드

## 📚 개요

`SearchQueryBuilder`는 8가지 GitHub 검색 조건을 GitHub API 쿼리 문자열로 변환하는 유틸리티 클래스입니다.

## 🎯 8가지 검색 조건

| 번호 | 조건             | 파라미터      | GitHub 쿼리 예시                             |
| ---- | ---------------- | ------------- | -------------------------------------------- |
| 1    | 사용자/조직 필터 | `type`        | `type:user`, `type:org`                      |
| 2    | 검색 대상 필드   | `searchIn`    | `in:login`, `in:name`, `in:email`            |
| 3    | 리포지토리 수    | `repos`       | `repos:>100`, `repos:10..50`                 |
| 4    | 위치             | `location`    | `location:Seoul`, `location:"San Francisco"` |
| 5    | 언어             | `language`    | `language:TypeScript`, `language:JavaScript` |
| 6    | 가입일           | `created`     | `created:>2020-01-01`, `created:2020..2023`  |
| 7    | 팔로워 수        | `followers`   | `followers:>100`, `followers:50..200`        |
| 8    | 후원 가능 여부   | `isSponsored` | `is:sponsorable`                             |

## 🚀 기본 사용법

### Import

```typescript
import { SearchQueryBuilder } from '@/application/use-cases/query-builder';
```

### 1. 기본 검색

```typescript
const query = SearchQueryBuilder.build({
  query: 'react',
  page: 1,
  perPage: 30,
});

console.log(query.q);
// 출력: "react"
```

### 2. 사용자 타입 필터

```typescript
// 사용자만 검색
const query = SearchQueryBuilder.build({
  query: 'javascript',
  type: 'user',
});

console.log(query.q);
// 출력: "javascript type:user"

// 조직만 검색
const query = SearchQueryBuilder.build({
  query: 'react',
  type: 'org',
});

console.log(query.q);
// 출력: "react type:org"
```

### 3. 검색 대상 필드 지정

```typescript
// 이름으로만 검색
const query = SearchQueryBuilder.build({
  query: 'John Doe',
  searchIn: ['name'],
});

console.log(query.q);
// 출력: "John Doe in:name"

// 이름과 이메일에서 검색
const query = SearchQueryBuilder.build({
  query: 'john',
  searchIn: ['name', 'email'],
});

console.log(query.q);
// 출력: "john in:name in:email"

// 로그인, 이름, 이메일 모두에서 검색
const query = SearchQueryBuilder.build({
  query: 'smith',
  searchIn: ['login', 'name', 'email'],
});

console.log(query.q);
// 출력: "smith in:login in:name in:email"
```

### 4. 리포지토리 수 필터

```typescript
// 100개 이상
const query = SearchQueryBuilder.build({
  query: 'developer',
  repos: { min: 100 },
});

console.log(query.q);
// 출력: "developer repos:>=100"

// 10~50개
const query = SearchQueryBuilder.build({
  query: 'developer',
  repos: { min: 10, max: 50 },
});

console.log(query.q);
// 출력: "developer repos:10..50"

// 정확히 42개
const query = SearchQueryBuilder.build({
  query: 'developer',
  repos: { exact: 42 },
});

console.log(query.q);
// 출력: "developer repos:42"
```

### 5. 위치 필터

```typescript
// 단일 단어 위치
const query = SearchQueryBuilder.build({
  query: 'developer',
  location: 'Seoul',
});

console.log(query.q);
// 출력: "developer location:Seoul"

// 공백 포함 위치 (자동 이스케이프)
const query = SearchQueryBuilder.build({
  query: 'developer',
  location: 'San Francisco',
});

console.log(query.q);
// 출력: 'developer location:"San Francisco"'
```

### 6. 언어 필터

```typescript
const query = SearchQueryBuilder.build({
  query: 'developer',
  language: 'TypeScript',
});

console.log(query.q);
// 출력: "developer language:TypeScript"
```

### 7. 가입일 필터

```typescript
// 2020년 이후 가입
const query = SearchQueryBuilder.build({
  query: 'developer',
  created: { from: '2020-01-01' },
});

console.log(query.q);
// 출력: "developer created:>=2020-01-01"

// 2020~2023년 사이
const query = SearchQueryBuilder.build({
  query: 'developer',
  created: { from: '2020-01-01', to: '2023-12-31' },
});

console.log(query.q);
// 출력: "developer created:2020-01-01..2023-12-31"

// 정확히 2022년 6월 15일
const query = SearchQueryBuilder.build({
  query: 'developer',
  created: { exact: '2022-06-15' },
});

console.log(query.q);
// 출력: "developer created:2022-06-15"
```

### 8. 팔로워 수 필터

```typescript
// 100명 이상
const query = SearchQueryBuilder.build({
  query: 'developer',
  followers: { min: 100 },
});

console.log(query.q);
// 출력: "developer followers:>=100"

// 50~200명
const query = SearchQueryBuilder.build({
  query: 'developer',
  followers: { min: 50, max: 200 },
});

console.log(query.q);
// 출력: "developer followers:50..200"
```

### 9. 후원 가능 여부 필터

```typescript
const query = SearchQueryBuilder.build({
  query: 'developer',
  isSponsored: true,
});

console.log(query.q);
// 출력: "developer is:sponsorable"
```

## 🎨 복합 검색 예시

### 예시 1: 서울의 TypeScript 개발자 찾기

```typescript
const query = SearchQueryBuilder.build({
  query: 'developer',
  type: 'user',
  location: 'Seoul',
  language: 'TypeScript',
  repos: { min: 10 },
  followers: { min: 100 },
  sort: 'followers',
  sortOrder: 'desc',
});

console.log(query);
// 출력:
// {
//   q: "developer type:user location:Seoul language:TypeScript repos:>=10 followers:>=100",
//   sort: "followers",
//   order: "desc",
//   page: undefined,
//   per_page: undefined
// }
```

### 예시 2: 최근 가입한 활발한 사용자 찾기

```typescript
const query = SearchQueryBuilder.build({
  query: 'javascript',
  type: 'user',
  created: { from: '2023-01-01' },
  repos: { min: 5, max: 50 },
  followers: { min: 10 },
  page: 1,
  perPage: 30,
});

console.log(query.q);
// 출력: "javascript type:user created:>=2023-01-01 repos:5..50 followers:>=10"
```

### 예시 3: 이름으로 특정 사용자 찾기

```typescript
const query = SearchQueryBuilder.build({
  query: 'John Smith',
  searchIn: ['name'],
  type: 'user',
  location: 'New York',
});

console.log(query.q);
// 출력: "John Smith in:name type:user location:"New York""
```

### 예시 4: 후원 가능한 오픈소스 기여자 찾기

```typescript
const query = SearchQueryBuilder.build({
  query: 'react contributor',
  type: 'user',
  repos: { min: 20 },
  followers: { min: 500 },
  isSponsored: true,
  sort: 'repositories',
  sortOrder: 'desc',
});

console.log(query.q);
// 출력: "react contributor type:user repos:>=20 followers:>=500 is:sponsorable"
```

## 📊 정렬 옵션

```typescript
const query = SearchQueryBuilder.build({
  query: 'developer',
  sort: 'followers', // 'best-match' | 'followers' | 'repositories' | 'joined'
  sortOrder: 'desc', // 'asc' | 'desc'
});

console.log(query);
// 출력:
// {
//   q: "developer",
//   sort: "followers",
//   order: "desc"
// }
```

### 정렬 옵션 종류

- `best-match` (기본값): 가장 관련성 높은 순서
- `followers`: 팔로워 수 순서
- `repositories`: 리포지토리 수 순서
- `joined`: 가입일 순서

## 🧪 테스트 케이스

### 테스트 1: 모든 필터 조합

```typescript
const query = SearchQueryBuilder.build({
  query: 'react developer',
  type: 'user',
  searchIn: ['name', 'email'],
  repos: { min: 10, max: 100 },
  location: 'San Francisco',
  language: 'JavaScript',
  created: { from: '2020-01-01', to: '2023-12-31' },
  followers: { min: 50, max: 500 },
  isSponsored: true,
  sort: 'followers',
  sortOrder: 'desc',
  page: 1,
  perPage: 30,
});

console.log(query.q);
// 출력: "react developer type:user in:name in:email repos:10..100 location:"San Francisco" language:JavaScript created:2020-01-01..2023-12-31 followers:50..500 is:sponsorable"
```

### 테스트 2: 빈 필터

```typescript
const query = SearchQueryBuilder.build({
  query: 'javascript',
});

console.log(query.q);
// 출력: "javascript"
```

### 테스트 3: 정확한 값 필터

```typescript
const query = SearchQueryBuilder.build({
  query: 'developer',
  repos: { exact: 42 },
  created: { exact: '2022-01-01' },
});

console.log(query.q);
// 출력: "developer repos:42 created:2022-01-01"
```

## 🔍 실전 활용 예시

### Redux에서 사용

```typescript
import { searchUsers } from '@/presentation/store/search-slice';

// 검색 실행
dispatch(
  searchUsers({
    query: 'react',
    type: 'user',
    location: 'Seoul',
    language: 'TypeScript',
    repos: { min: 10 },
    followers: { min: 100 },
    page: 1,
    perPage: 30,
  })
);
```

### API 라우트에서 사용

```typescript
// app/api/search/users/route.ts
import { SearchQueryBuilder } from '@/application/use-cases/query-builder';

const filters = await request.json();
const query = SearchQueryBuilder.build(filters);

// GitHub API 호출
const url = `https://api.github.com/search/users?q=${encodeURIComponent(query.q)}`;
```

### 컴포넌트에서 사용

```typescript
'use client';

import { useSearch } from '@/presentation/store';

export default function SearchPage() {
  const { search } = useSearch();

  const handleSearch = () => {
    search({
      query: 'javascript developer',
      type: 'user',
      location: 'Seoul',
      language: 'TypeScript',
      repos: { min: 10 },
      sort: 'followers',
      sortOrder: 'desc',
    });
  };

  return <button onClick={handleSearch}>Search</button>;
}
```

## ⚠️ 주의사항

1. **공백 처리**
   - 위치나 이름에 공백이 있으면 자동으로 큰따옴표로 감싸집니다
   - 예: `location: "San Francisco"` → `location:"San Francisco"`

2. **날짜 형식**
   - 반드시 `YYYY-MM-DD` 형식 사용
   - 예: `2020-01-01`, `2023-12-31`

3. **범위 필터 우선순위**
   - `exact` > `min & max` > `min` > `max`
   - `exact`가 있으면 `min`/`max` 무시

4. **정렬 옵션**
   - `best-match`는 GitHub 기본값이므로 쿼리에 포함되지 않음
   - 다른 정렬 옵션만 명시적으로 전달

5. **isSponsored**
   - `true`일 때만 쿼리에 포함
   - `false`이면 무시됨

## 📚 GitHub API 공식 문서

- [Search Users API](https://docs.github.com/en/rest/search/search#search-users)
- [Search Qualifiers](https://docs.github.com/en/search-github/searching-on-github/searching-users)

---

**참고**: 이 Query Builder는 Clean Architecture의 Application Layer에 위치하며, Domain 타입을 사용하여 Infrastructure Layer와 독립적으로 동작합니다.
