/**
 * useSearch 커스텀 훅
 * - Redux Store 검색 상태를 쉽게 사용하기 위한 훅
 * - 액션 디스패치 및 셀렉터 접근을 단순화
 */

'use client';

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './index';
import {
  searchUsers,
  loadMoreUsers,
  fetchRateLimit,
  setSearchQuery,
  updateFilters,
  setFilters,
  setSortOption,
  resetSearch,
  resetAll,
  clearError,
} from './search-slice';
import {
  selectSearchQuery,
  selectFilters,
  selectUsers,
  selectMetadata,
  selectLoading,
  selectError,
  selectRateLimit,
  selectHasMore,
  selectIsSearched,
  selectCanSearch,
  selectCanLoadMore,
  selectActiveFiltersCount,
  selectHasActiveFilters,
  selectSearchResultState,
  selectPaginationInfo,
  selectRateLimitPercentage,
  selectIsRateLimitLow,
} from './search-selectors';
import { SearchFilters } from '@/domain/types/filters';

/**
 * 검색 기능을 위한 커스텀 훅
 */
export function useSearch() {
  const dispatch = useAppDispatch();

  // 상태 셀렉터
  const searchQuery = useAppSelector(selectSearchQuery);
  const filters = useAppSelector(selectFilters);
  const users = useAppSelector(selectUsers);
  const metadata = useAppSelector(selectMetadata);
  const loading = useAppSelector(selectLoading);
  const error = useAppSelector(selectError);
  const rateLimit = useAppSelector(selectRateLimit);
  const hasMore = useAppSelector(selectHasMore);
  const isSearched = useAppSelector(selectIsSearched);

  // 파생 상태
  const canSearch = useAppSelector(selectCanSearch);
  const canLoadMore = useAppSelector(selectCanLoadMore);
  const activeFiltersCount = useAppSelector(selectActiveFiltersCount);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);
  const searchResultState = useAppSelector(selectSearchResultState);
  const paginationInfo = useAppSelector(selectPaginationInfo);
  const rateLimitPercentage = useAppSelector(selectRateLimitPercentage);
  const isRateLimitLow = useAppSelector(selectIsRateLimitLow);

  // 액션 디스패처
  const handleSetSearchQuery = useCallback(
    (query: string) => {
      dispatch(setSearchQuery(query));
    },
    [dispatch]
  );

  const handleUpdateFilters = useCallback(
    (partialFilters: Partial<SearchFilters>) => {
      dispatch(updateFilters(partialFilters));
    },
    [dispatch]
  );

  const handleSetFilters = useCallback(
    (newFilters: SearchFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const handleSetSortOption = useCallback(
    (sort: SearchFilters['sort'], sortOrder: SearchFilters['sortOrder']) => {
      dispatch(setSortOption({ sort, sortOrder }));
    },
    [dispatch]
  );

  const handleSearch = useCallback(
    async (customFilters?: Partial<SearchFilters>) => {
      const searchFilters = {
        ...filters,
        ...customFilters,
        query: customFilters?.query || searchQuery,
        page: 1,
      };

      await dispatch(searchUsers(searchFilters)).unwrap();
    },
    [dispatch, filters, searchQuery]
  );

  const handleLoadMore = useCallback(async () => {
    if (!canLoadMore) return;
    await dispatch(loadMoreUsers()).unwrap();
  }, [dispatch, canLoadMore]);

  const handleFetchRateLimit = useCallback(async () => {
    await dispatch(fetchRateLimit()).unwrap();
  }, [dispatch]);

  const handleResetSearch = useCallback(() => {
    dispatch(resetSearch());
  }, [dispatch]);

  const handleResetAll = useCallback(() => {
    dispatch(resetAll());
  }, [dispatch]);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    // 상태
    searchQuery,
    filters,
    users,
    metadata,
    loading,
    error,
    rateLimit,
    hasMore,
    isSearched,

    // 파생 상태
    canSearch,
    canLoadMore,
    activeFiltersCount,
    hasActiveFilters,
    searchResultState,
    paginationInfo,
    rateLimitPercentage,
    isRateLimitLow,

    // 액션
    setSearchQuery: handleSetSearchQuery,
    updateFilters: handleUpdateFilters,
    setFilters: handleSetFilters,
    setSortOption: handleSetSortOption,
    search: handleSearch,
    loadMore: handleLoadMore,
    fetchRateLimit: handleFetchRateLimit,
    resetSearch: handleResetSearch,
    resetAll: handleResetAll,
    clearError: handleClearError,
  };
}
