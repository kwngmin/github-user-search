/**
 * Redux Toolkit 검색 슬라이스
 * - 검색 상태 관리
 * - 비동기 검색 액션
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GitHubUser, SearchMetadata, RateLimit } from '@/domain/entities/user';
import { SearchFilters } from '@/domain/types/filters';

/**
 * 검색 상태 인터페이스
 */
interface SearchState {
  // 검색 결과
  users: GitHubUser[];
  metadata: SearchMetadata | null;

  // 현재 필터
  filters: SearchFilters;

  // UI 상태
  isLoading: boolean;
  error: string | null;

  // Rate Limit
  rateLimit: RateLimit | null;

  // 무한 스크롤
  hasMore: boolean;
}

/**
 * 초기 상태
 */
const initialState: SearchState = {
  users: [],
  metadata: null,
  filters: {
    query: '',
    page: 1,
    perPage: 30,
    sort: 'best-match',
    sortOrder: 'desc',
  },
  isLoading: false,
  error: null,
  rateLimit: null,
  hasMore: true,
};

/**
 * 비동기 액션: 사용자 검색
 */
export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async (filters: SearchFilters, { rejectWithValue }) => {
    try {
      // 서버 라우트로 요청 (/api/search)
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Search failed');
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Unknown error'
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
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);

/**
 * 검색 슬라이스
 */
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // 필터 업데이트
    updateFilters: (state, action: PayloadAction<Partial<SearchFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };

      // 새로운 검색이면 페이지 초기화
      if (
        action.payload.query !== undefined ||
        action.payload.type !== undefined ||
        action.payload.sort !== undefined
      ) {
        state.filters.page = 1;
        state.users = [];
      }
    },

    // 검색 초기화
    resetSearch: state => {
      state.users = [];
      state.metadata = null;
      state.error = null;
      state.hasMore = true;
      state.filters.page = 1;
    },

    // 에러 클리어
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // searchUsers 액션 처리
    builder
      .addCase(searchUsers.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;

        // 첫 페이지면 교체, 아니면 추가 (무한 스크롤)
        if (state.filters.page === 1) {
          state.users = action.payload.users;
        } else {
          state.users = [...state.users, ...action.payload.users];
        }

        state.metadata = action.payload.metadata;
        state.hasMore = action.payload.metadata.hasNextPage;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.hasMore = false;
      });

    // fetchRateLimit 액션 처리
    builder.addCase(fetchRateLimit.fulfilled, (state, action) => {
      state.rateLimit = action.payload;
    });
  },
});

export const { updateFilters, resetSearch, clearError } = searchSlice.actions;
export default searchSlice.reducer;
