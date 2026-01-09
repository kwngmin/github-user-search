/**
 * Redux Toolkit 검색 슬라이스
 * - 검색 상태 관리 (searchQuery, filters, users, loading, error)
 * - 비동기 검색 액션
 * - 무한 스크롤 지원
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GitHubUser, SearchMetadata, RateLimit } from '@/domain/entities/user';
import { SearchFilters } from '@/domain/types/filters';

/**
 * 검색 상태 인터페이스
 */
interface SearchState {
  // 검색어 (사용자 입력)
  searchQuery: string;

  // 검색 필터 (8가지 필터 옵션)
  filters: SearchFilters;

  // 검색 결과
  users: GitHubUser[];
  metadata: SearchMetadata | null;

  // 로딩 상태
  loading: boolean;

  // 에러 상태
  error: string | null;

  // Rate Limit 정보
  rateLimit: RateLimit | null;

  // 무한 스크롤 상태
  hasMore: boolean;

  // 검색 실행 여부 (검색 버튼 클릭 전/후 구분)
  isSearched: boolean;
}

/**
 * 초기 상태
 */
const initialState: SearchState = {
  searchQuery: '',
  filters: {
    query: '',
    page: 1,
    perPage: 30,
    sort: 'best-match',
    sortOrder: 'desc',
  },
  users: [],
  metadata: null,
  loading: false,
  error: null,
  rateLimit: null,
  hasMore: true,
  isSearched: false,
};

/**
 * 비동기 액션: 사용자 검색
 */
export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      console.log('[searchUsers] Calling API with filters:', filters);

      // 서버 라우트로 요청 (/api/search/users)
      const response = await fetch('/api/search/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      console.log('[searchUsers] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[searchUsers] API Error:', error);
        return rejectWithValue(error.error || error.message || 'Search failed');
      }

      const data = await response.json();
      console.log('[searchUsers] Success, users count:', data.users?.length);
      console.log('[searchUsers] Received metadata:', data.metadata);
      console.log(
        '[searchUsers] metadata.hasNextPage:',
        data.metadata?.hasNextPage
      );

      // Rate Limit 헤더 추출
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      return {
        ...data,
        rateLimitInfo: rateLimitRemaining
          ? {
              remaining: parseInt(rateLimitRemaining, 10),
              limit: rateLimitLimit ? parseInt(rateLimitLimit, 10) : 0,
              reset: rateLimitReset ? parseInt(rateLimitReset, 10) : 0,
            }
          : null,
      };
    } catch (error) {
      console.error('[searchUsers] Exception:', error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

/**
 * 비동기 액션: Rate Limit 조회
 */
export const fetchRateLimit = createAsyncThunk(
  'search/fetchRateLimit',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/rate-limit');

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch rate limit');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
);

/**
 * 비동기 액션: 다음 페이지 로드 (무한 스크롤)
 */
export const loadMoreUsers = createAsyncThunk(
  'search/loadMoreUsers',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { search: SearchState };
    const { filters } = state.search;

    // 다음 페이지 번호로 검색
    const nextPageFilters = {
      ...filters,
      page: (filters.page || 1) + 1,
    };

    try {
      console.log('[loadMoreUsers] Loading page:', nextPageFilters.page);

      const response = await fetch('/api/search/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nextPageFilters),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(
          error.error || error.message || 'Failed to load more users'
        );
      }

      const data = await response.json();
      console.log('[loadMoreUsers] Loaded users:', data.users?.length);

      return data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  },
  {
    // 이미 로딩 중이거나 더 이상 데이터가 없으면 실행하지 않음
    condition: (_, { getState }) => {
      const { search } = getState() as { search: SearchState };
      if (search.loading || !search.hasMore) {
        return false;
      }
    },
  }
);

/**
 * 검색 슬라이스
 */
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // 검색어 업데이트 (입력창 onChange)
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      // filters.query도 함께 업데이트 (동기화)
      state.filters.query = action.payload;
    },

    // 필터 업데이트 (개별 필터 변경)
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };

      // 새로운 검색이면 페이지 초기화
      if (
        action.payload.query !== undefined ||
        action.payload.type !== undefined ||
        action.payload.sort !== undefined ||
        action.payload.sortOrder !== undefined
      ) {
        state.filters.page = 1;
        state.users = [];
        state.hasMore = true;
      }
    },

    // 필터 일괄 업데이트
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
      state.users = [];
      state.hasMore = true;
    },

    // 정렬 옵션 변경
    setSortOption: (
      state,
      action: PayloadAction<{
        sort: SearchFilters['sort'];
        sortOrder: SearchFilters['sortOrder'];
      }>
    ) => {
      state.filters.sort = action.payload.sort;
      state.filters.sortOrder = action.payload.sortOrder;
      state.filters.page = 1;
      state.users = [];
      state.hasMore = true;
    },

    // 검색 초기화
    resetSearch: state => {
      state.users = [];
      state.metadata = null;
      state.error = null;
      state.hasMore = true;
      state.filters.page = 1;
      state.isSearched = false;
    },

    // 전체 상태 초기화 (검색어 포함)
    resetAll: state => {
      return { ...initialState };
    },

    // 에러 클리어
    clearError: state => {
      state.error = null;
    },

    // 페이지 증가 (무한 스크롤용)
    incrementPage: state => {
      state.filters.page = (state.filters.page || 1) + 1;
    },
  },
  extraReducers: builder => {
    // searchUsers 액션 처리
    builder
      .addCase(searchUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.isSearched = true;

        // searchUsers는 항상 새로운 검색이므로 기존 목록을 교체하고 페이지를 1로 초기화
        state.users = action.payload.users;
        state.filters.page = 1;

        state.metadata = action.payload.metadata;
        state.hasMore = action.payload.metadata.hasNextPage;

        console.log('[searchUsers.fulfilled] Page reset to 1');
        console.log(
          '[searchUsers.fulfilled] Users received:',
          action.payload.users.length
        );
        console.log('[searchUsers.fulfilled] Total users:', state.users.length);
        console.log(
          '[searchUsers.fulfilled] hasNextPage from API:',
          action.payload.metadata.hasNextPage
        );
        console.log('[searchUsers.fulfilled] hasMore state:', state.hasMore);
        console.log(
          '[searchUsers.fulfilled] totalCount:',
          action.payload.metadata.totalCount
        );

        // Rate Limit 정보 업데이트
        if (action.payload.rateLimitInfo) {
          state.rateLimit = {
            ...action.payload.rateLimitInfo,
            used:
              action.payload.rateLimitInfo.limit -
              action.payload.rateLimitInfo.remaining,
          };
        }
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.hasMore = false;
        state.isSearched = true;
      });

    // loadMoreUsers 액션 처리 (무한 스크롤)
    builder
      .addCase(loadMoreUsers.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMoreUsers.fulfilled, (state, action) => {
        state.loading = false;

        // 기존 사용자 목록에 추가
        state.users = [...state.users, ...action.payload.users];
        state.metadata = action.payload.metadata;
        state.hasMore = action.payload.metadata.hasNextPage;

        // 실제 성공적으로 불러온 페이지 번호로 업데이트
        state.filters.page = action.payload.metadata.currentPage;
      })
      .addCase(loadMoreUsers.rejected, (state, action) => {
        state.loading = false;
        // 에러가 발생하더라도 hasMore를 false로 만들지 않음 (사용자가 재시도할 수 있도록)
        state.error = action.payload as string;
      });

    // fetchRateLimit 액션 처리
    builder
      .addCase(fetchRateLimit.pending, state => {
        // Rate Limit 조회는 백그라운드에서 실행되므로 loading 상태 변경 안함
      })
      .addCase(fetchRateLimit.fulfilled, (state, action) => {
        state.rateLimit = action.payload;
      })
      .addCase(fetchRateLimit.rejected, (state, action) => {
        // Rate Limit 조회 실패는 조용히 처리
        console.error('Failed to fetch rate limit:', action.payload);
      });
  },
});

export const {
  setSearchQuery,
  updateFilters,
  setFilters,
  setSortOption,
  resetSearch,
  resetAll,
  clearError,
  incrementPage,
} = searchSlice.actions;

export default searchSlice.reducer;
