/**
 * 사용자 목록 컴포넌트
 * - Tailwind CSS Grid 레이아웃 사용
 * - 반응형: SM(1열) / MD(2열) / LG(3열) / XL(4열)
 * - 무한 스크롤 지원
 * - 다크모드 지원
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Button,
  Skeleton,
} from '@mui/material';
import UserCard from '../UserCard';
import { useSearch } from '@/presentation/store/use-search';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function UserList() {
  const {
    users,
    loading,
    error,
    searchResultState,
    canLoadMore,
    paginationInfo,
    loadMore,
    clearError,
  } = useSearch();

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(loading);

  // loading 상태 추적 (Observer 클로저용)
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // 무한 스크롤 - Intersection Observer
  useEffect(() => {
    // canLoadMore가 false면 Observer 생성하지 않음
    if (!canLoadMore) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        // 화면에 보이고, 로딩 중이 아닐 때만 loadMore 호출
        // loadingRef를 사용하여 Observer 재생성 없이 최신 loading 상태 참조
        if (entries[0].isIntersecting && !loadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [canLoadMore, loadMore]); // loading을 의존성에서 제거하여 Observer 재생성 방지

  // 초기 상태 (검색 전)
  if (searchResultState === 'initial') {
    return (
      <Box className="text-center py-20">
        <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography
          variant="h5"
          className="text-gray-600 dark:text-gray-400 mb-2"
        >
          Start Your Search
        </Typography>
        <Typography
          variant="body2"
          className="text-gray-500 dark:text-gray-500"
        >
          Enter a search query and click "Search" to find GitHub users
        </Typography>
      </Box>
    );
  }

  // 에러 상태
  if (searchResultState === 'error') {
    return (
      <Box className="text-center py-20">
        <Alert
          severity="error"
          icon={<ErrorOutlineIcon />}
          sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}
        >
          <Typography variant="body1" className="font-semibold mb-1">
            Search Failed
          </Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={clearError}
        >
          Try Again
        </Button>
      </Box>
    );
  }

  // 로딩 스켈레톤 (첫 페이지 로딩 시)
  if (searchResultState === 'loading' && users.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <Box key={index} className="p-4 bg-white dark:bg-gray-800 rounded-xl">
            <div className="flex items-start gap-3 mb-3">
              <Skeleton variant="circular" width={80} height={80} />
              <div className="flex-1">
                <Skeleton variant="text" width="80%" height={30} />
                <Skeleton variant="text" width="60%" height={20} />
              </div>
            </div>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton
              variant="rectangular"
              height={60}
              className="mt-3 rounded"
            />
          </Box>
        ))}
      </div>
    );
  }

  // 검색 결과 없음
  if (searchResultState === 'empty') {
    return (
      <Box className="text-center py-20">
        <SearchOffIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
        <Typography
          variant="h5"
          className="text-gray-600 dark:text-gray-400 mb-2"
        >
          No Results Found
        </Typography>
        <Typography
          variant="body2"
          className="text-gray-500 dark:text-gray-500"
        >
          Try adjusting your search query or filters
        </Typography>
      </Box>
    );
  }

  // 검색 결과 표시
  return (
    <Box>
      {/* 검색 결과 헤더 */}
      <Box className="mb-4 flex items-center justify-between">
        <Typography
          variant="body1"
          className="text-gray-700 dark:text-gray-300"
        >
          Found <strong>{paginationInfo.totalCount.toLocaleString()}</strong>{' '}
          users
          {paginationInfo.totalCount > paginationInfo.currentCount && (
            <span className="text-gray-500 dark:text-gray-400">
              {' '}
              (showing {paginationInfo.currentCount.toLocaleString()})
            </span>
          )}
        </Typography>
      </Box>

      {/* 사용자 카드 그리드 - Tailwind CSS Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      <div
        ref={canLoadMore ? observerTarget : null}
        className="h-20 flex items-center justify-center mt-8"
      >
        {loading && (
          <Box className="flex items-center gap-2">
            <CircularProgress size={24} />
            <Typography
              variant="body2"
              className="text-gray-500 dark:text-gray-400"
            >
              Loading more users...
            </Typography>
          </Box>
        )}
        {!loading && !canLoadMore && users.length > 0 && (
          <Typography
            variant="body2"
            className="text-gray-500 dark:text-gray-400"
          >
            ✓ All results loaded
          </Typography>
        )}
      </div>

      {/* 에러 표시 (무한 스크롤 중 에러) */}
      {error && users.length > 0 && (
        <Alert severity="warning" className="mt-4">
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
    </Box>
  );
}
