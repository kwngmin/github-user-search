/**
 * Redux Selectors
 * - 검색 상태에 접근하기 위한 헬퍼 함수들
 * - 메모이제이션을 통한 성능 최적화
 */

import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

/**
 * 기본 셀렉터들
 */
export const selectSearchQuery = (state: RootState) => state.search.searchQuery;
export const selectFilters = (state: RootState) => state.search.filters;
export const selectUsers = (state: RootState) => state.search.users;
export const selectMetadata = (state: RootState) => state.search.metadata;
export const selectLoading = (state: RootState) => state.search.loading;
export const selectError = (state: RootState) => state.search.error;
export const selectRateLimit = (state: RootState) => state.search.rateLimit;
export const selectHasMore = (state: RootState) => state.search.hasMore;
export const selectIsSearched = (state: RootState) => state.search.isSearched;

/**
 * 파생 셀렉터 (Memoized)
 */

// 검색 결과 개수
export const selectUsersCount = createSelector(
  [selectUsers],
  users => users.length
);

// 전체 결과 개수
export const selectTotalCount = createSelector(
  [selectMetadata],
  metadata => metadata?.totalCount || 0
);

// 현재 페이지
export const selectCurrentPage = createSelector(
  [selectFilters],
  filters => filters.page || 1
);

// Rate Limit 남은 비율 (0-1)
export const selectRateLimitPercentage = createSelector(
  [selectRateLimit],
  rateLimit => {
    if (!rateLimit || rateLimit.limit === 0) return 1;
    return rateLimit.remaining / rateLimit.limit;
  }
);

// Rate Limit 경고 여부 (남은 요청이 10% 미만)
export const selectIsRateLimitLow = createSelector(
  [selectRateLimitPercentage],
  percentage => percentage < 0.1
);

// Rate Limit 리셋 시간 (Date 객체)
export const selectRateLimitResetDate = createSelector(
  [selectRateLimit],
  rateLimit => {
    if (!rateLimit) return null;
    return new Date(rateLimit.reset * 1000);
  }
);

// 검색 실행 가능 여부
export const selectCanSearch = createSelector(
  [selectSearchQuery, selectLoading],
  (query, loading) => query.trim().length > 0 && !loading
);

// 무한 스크롤 트리거 가능 여부
export const selectCanLoadMore = createSelector(
  [selectHasMore, selectLoading, selectIsSearched],
  (hasMore, loading, isSearched) => hasMore && !loading && isSearched
);

// 현재 활성화된 필터 개수
export const selectActiveFiltersCount = createSelector(
  [selectFilters],
  filters => {
    let count = 0;
    if (filters.type) count++;
    if (filters.searchIn && filters.searchIn.length > 0) count++;
    if (filters.repos) count++;
    if (filters.location) count++;
    if (filters.language) count++;
    if (filters.created) count++;
    if (filters.followers) count++;
    if (filters.isSponsored) count++;
    return count;
  }
);

// 필터가 적용되어 있는지 여부
export const selectHasActiveFilters = createSelector(
  [selectActiveFiltersCount],
  count => count > 0
);

// 검색 결과 표시 상태 (empty, loading, error, success)
export const selectSearchResultState = createSelector(
  [selectLoading, selectError, selectUsers, selectIsSearched],
  (loading, error, users, isSearched) => {
    if (loading) return 'loading';
    if (error) return 'error';
    if (!isSearched) return 'initial';
    if (users.length === 0) return 'empty';
    return 'success';
  }
);

// 페이지네이션 정보
export const selectPaginationInfo = createSelector(
  [selectCurrentPage, selectMetadata, selectUsersCount],
  (currentPage, metadata, usersCount) => {
    if (!metadata) {
      return {
        currentPage: 1,
        totalPages: 0,
        currentCount: 0,
        totalCount: 0,
        hasNextPage: false,
      };
    }

    const totalPages = Math.ceil(metadata.totalCount / metadata.perPage);

    return {
      currentPage,
      totalPages,
      currentCount: usersCount,
      totalCount: metadata.totalCount,
      hasNextPage: metadata.hasNextPage,
    };
  }
);
