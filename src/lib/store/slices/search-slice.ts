import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * 검색 필터 타입
 */
export interface SearchFilters {
  query: string; // 검색어
  type?: 'user' | 'org'; // 사용자 또는 조직
  in?: ('login' | 'name' | 'email')[]; // 검색 대상
  repos?: string; // 리포지토리 수 (예: ">10", "10..50")
  location?: string; // 위치
  language?: string; // 프로그래밍 언어
  created?: string; // 가입일 (예: ">2020-01-01", "2020..2023")
  followers?: string; // 팔로워 수 (예: ">100", "50..200")
  sponsorable?: boolean; // 후원 가능 여부
}

/**
 * GitHub 사용자 타입 (간소화 버전)
 */
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  name?: string;
  location?: string;
  email?: string;
  public_repos: number;
  followers: number;
  created_at: string;
}

/**
 * 검색 결과 타입
 */
export interface SearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubUser[];
}

/**
 * 정렬 옵션
 */
export type SortOption = 'best-match' | 'followers' | 'repositories' | 'joined';
export type SortOrder = 'desc' | 'asc';

/**
 * 검색 상태 인터페이스
 */
interface SearchState {
  filters: SearchFilters;
  results: GitHubUser[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  sort: SortOption;
  order: SortOrder;
  rateLimit: {
    remaining: number;
    limit: number;
    reset: number;
  } | null;
}

/**
 * 초기 상태
 */
const initialState: SearchState = {
  filters: {
    query: '',
  },
  results: [],
  totalCount: 0,
  loading: false,
  error: null,
  page: 1,
  hasMore: true,
  sort: 'best-match',
  order: 'desc',
  rateLimit: null,
};

/**
 * Search Slice
 * - 검색 필터, 결과, 로딩 상태 관리
 */
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    // 검색 필터 업데이트
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
      state.page = 1; // 필터 변경 시 페이지 초기화
      state.results = []; // 기존 결과 초기화
    },

    // 정렬 옵션 변경
    setSort: (
      state,
      action: PayloadAction<{ sort: SortOption; order: SortOrder }>
    ) => {
      state.sort = action.payload.sort;
      state.order = action.payload.order;
      state.page = 1;
      state.results = [];
    },

    // 검색 시작
    searchStart: state => {
      state.loading = true;
      state.error = null;
    },

    // 검색 성공 (첫 페이지)
    searchSuccess: (state, action: PayloadAction<SearchResult>) => {
      state.loading = false;
      state.results = action.payload.items;
      state.totalCount = action.payload.total_count;
      state.hasMore = action.payload.items.length > 0;
    },

    // 검색 성공 (다음 페이지 - 무한 스크롤)
    searchMoreSuccess: (state, action: PayloadAction<SearchResult>) => {
      state.loading = false;
      state.results = [...state.results, ...action.payload.items];
      state.hasMore = action.payload.items.length > 0;
    },

    // 검색 실패
    searchFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    // 다음 페이지 로드
    loadNextPage: state => {
      state.page += 1;
    },

    // Rate Limit 정보 업데이트
    setRateLimit: (
      state,
      action: PayloadAction<{
        remaining: number;
        limit: number;
        reset: number;
      }>
    ) => {
      state.rateLimit = action.payload;
    },

    // 검색 초기화
    resetSearch: state => {
      state.results = [];
      state.totalCount = 0;
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
  },
});

export const {
  setFilters,
  setSort,
  searchStart,
  searchSuccess,
  searchMoreSuccess,
  searchFailure,
  loadNextPage,
  setRateLimit,
  resetSearch,
} = searchSlice.actions;

export default searchSlice.reducer;
