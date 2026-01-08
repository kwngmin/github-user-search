# Redux Toolkit Store 사용 가이드

## 📦 구조 개요

```
src/presentation/store/
├── index.ts                # Store 설정 및 exports
├── search-slice.ts         # 검색 상태 관리 슬라이스
├── search-selectors.ts     # Memoized 셀렉터
└── use-search.ts           # 커스텀 훅 (권장)
```

## 🎯 상태 구조

```typescript
interface SearchState {
  searchQuery: string;        // 사용자가 입력한 검색어
  filters: SearchFilters;     // 8가지 검색 필터
  users: GitHubUser[];        // 검색 결과 사용자 목록
  metadata: SearchMetadata;   // 페이지네이션 정보
  loading: boolean;           // 로딩 상태
  error: string | null;       // 에러 메시지
  rateLimit: RateLimit;       // GitHub API Rate Limit
  hasMore: boolean;           // 무한 스크롤 가능 여부
  isSearched: boolean;        // 검색 실행 여부
}
```

## 🚀 사용 방법

### 1. useSearch 커스텀 훅 사용 (권장)

가장 간단하고 권장되는 방법입니다.

```tsx
'use client';

import { useSearch } from '@/presentation/store';

export default function MyComponent() {
  const {
    // 상태
    searchQuery,
    users,
    loading,
    error,
    
    // 액션
    setSearchQuery,
    search,
    loadMore,
    
    // 파생 상태
    canSearch,
    canLoadMore,
    searchResultState,
  } = useSearch();

  const handleSearch = async () => {
    try {
      await search();
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div>
      <input 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <button onClick={handleSearch} disabled={!canSearch}>
        Search
      </button>
      
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      
      {users.map(user => (
        <div key={user.id}>{user.login}</div>
      ))}
    </div>
  );
}
```

### 2. Redux Hooks 직접 사용

더 세밀한 제어가 필요한 경우:

```tsx
'use client';

import { useAppDispatch, useAppSelector } from '@/presentation/store';
import { 
  searchUsers, 
  setSearchQuery,
  selectUsers,
  selectLoading 
} from '@/presentation/store/search-slice';

export default function MyComponent() {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectLoading);

  const handleSearch = () => {
    dispatch(searchUsers({ query: 'react', page: 1, perPage: 30 }));
  };

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
      {/* ... */}
    </div>
  );
}
```

## 📋 주요 액션 (Actions)

### 1. 검색어 설정
```tsx
setSearchQuery('react developer');
```

### 2. 필터 업데이트
```tsx
// 개별 필터 업데이트
updateFilters({ 
  type: 'user',
  location: 'Seoul',
  followers: { min: 100 }
});

// 전체 필터 교체
setFilters({
  query: 'javascript',
  type: 'user',
  location: 'Seoul',
  repos: { min: 10 },
  page: 1,
  perPage: 30,
});
```

### 3. 검색 실행
```tsx
// 기본 검색
await search();

// 커스텀 필터와 함께 검색
await search({ 
  location: 'Tokyo',
  language: 'TypeScript' 
});
```

### 4. 무한 스크롤 (다음 페이지 로드)
```tsx
if (canLoadMore) {
  await loadMore();
}
```

### 5. 정렬 옵션 변경
```tsx
setSortOption('followers', 'desc');
// 또는
setSortOption('repositories', 'asc');
```

### 6. 검색 초기화
```tsx
resetSearch();  // 결과만 초기화
resetAll();     // 검색어 포함 전체 초기화
```

## 🎨 셀렉터 (Selectors)

메모이제이션된 셀렉터로 성능 최적화:

```tsx
import { 
  selectUsers,
  selectLoading,
  selectCanLoadMore,
  selectActiveFiltersCount,
  selectSearchResultState,
  selectPaginationInfo,
  selectRateLimitPercentage,
} from '@/presentation/store';

const users = useAppSelector(selectUsers);
const loading = useAppSelector(selectLoading);
const canLoadMore = useAppSelector(selectCanLoadMore);
const activeFiltersCount = useAppSelector(selectActiveFiltersCount);
const resultState = useAppSelector(selectSearchResultState);
// 'initial' | 'loading' | 'error' | 'empty' | 'success'
```

## 💡 실전 예시

### 검색 페이지 전체 구현

```tsx
'use client';

import { useEffect } from 'react';
import { useSearch } from '@/presentation/store';
import { UserCard } from './UserCard';
import { SearchBar } from './SearchBar';
import { FilterPanel } from './FilterPanel';

export default function SearchPage() {
  const {
    users,
    loading,
    error,
    searchResultState,
    canLoadMore,
    paginationInfo,
    rateLimitPercentage,
    isRateLimitLow,
    loadMore,
    fetchRateLimit,
  } = useSearch();

  // 초기 Rate Limit 조회
  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  // 무한 스크롤 처리
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= 
        document.body.offsetHeight - 500
      ) {
        if (canLoadMore) {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [canLoadMore, loadMore]);

  return (
    <div className="container mx-auto p-4">
      {/* Rate Limit 경고 */}
      {isRateLimitLow && (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          ⚠️ Rate Limit 경고: {(rateLimitPercentage * 100).toFixed(0)}% 남음
        </div>
      )}

      {/* 검색바 */}
      <SearchBar />

      {/* 필터 패널 */}
      <FilterPanel />

      {/* 검색 결과 */}
      <div className="mt-6">
        {searchResultState === 'initial' && (
          <p className="text-center text-gray-500">
            검색어를 입력하고 검색 버튼을 눌러주세요.
          </p>
        )}

        {searchResultState === 'loading' && loading && (
          <p className="text-center">검색 중...</p>
        )}

        {searchResultState === 'error' && (
          <p className="text-center text-red-500">
            에러: {error}
          </p>
        )}

        {searchResultState === 'empty' && (
          <p className="text-center text-gray-500">
            검색 결과가 없습니다.
          </p>
        )}

        {searchResultState === 'success' && (
          <>
            {/* 페이지네이션 정보 */}
            <div className="mb-4 text-gray-600">
              전체 {paginationInfo.totalCount}개 중 {paginationInfo.currentCount}개 표시
            </div>

            {/* 사용자 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(user => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>

            {/* 로딩 인디케이터 */}
            {loading && (
              <div className="text-center mt-4">
                <p>더 불러오는 중...</p>
              </div>
            )}

            {/* 더 이상 결과 없음 */}
            {!canLoadMore && (
              <div className="text-center mt-4 text-gray-500">
                모든 결과를 불러왔습니다.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
```

## 🔧 고급 사용법

### 1. 특정 필터만 토글

```tsx
const toggleUserType = () => {
  updateFilters({ 
    type: filters.type === 'user' ? 'org' : 'user' 
  });
};
```

### 2. 범위 필터 설정

```tsx
// 리포지토리 수: 10개 이상
updateFilters({ 
  repos: { min: 10 } 
});

// 팔로워 수: 100~500명
updateFilters({ 
  followers: { min: 100, max: 500 } 
});

// 정확히 10개
updateFilters({ 
  repos: { exact: 10 } 
});
```

### 3. 날짜 범위 필터

```tsx
// 2020년 이후 가입
updateFilters({ 
  created: { from: '2020-01-01' } 
});

// 2020~2023년 사이
updateFilters({ 
  created: { from: '2020-01-01', to: '2023-12-31' } 
});
```

### 4. 복합 필터 검색

```tsx
await search({
  query: 'react',
  type: 'user',
  location: 'Seoul',
  language: 'TypeScript',
  repos: { min: 10 },
  followers: { min: 100 },
  created: { from: '2020-01-01' },
  sort: 'followers',
  sortOrder: 'desc',
});
```

## 🧪 테스트 예시

```typescript
import { configureStore } from '@reduxjs/toolkit';
import searchReducer, { 
  setSearchQuery, 
  searchUsers 
} from './search-slice';

describe('Search Slice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: { search: searchReducer },
    });
  });

  it('should set search query', () => {
    store.dispatch(setSearchQuery('react'));
    expect(store.getState().search.searchQuery).toBe('react');
  });

  it('should handle searchUsers pending', () => {
    store.dispatch(searchUsers.pending('', { query: 'test' }));
    expect(store.getState().search.loading).toBe(true);
  });
});
```

## ⚠️ 주의사항

1. **무한 스크롤**: `canLoadMore`를 체크하여 불필요한 API 호출 방지
2. **Rate Limit**: `isRateLimitLow` 모니터링으로 사용자에게 경고
3. **에러 처리**: 모든 비동기 액션에 try-catch 사용
4. **메모리 관리**: 페이지 이동 시 `resetAll()` 호출 권장

---

**참고**: 이 문서는 과제 요구사항에 맞춰 작성되었습니다.