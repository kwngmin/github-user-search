/**
 * 검색바 컴포넌트
 * - MUI TextField 사용
 * - 검색어 입력 및 검색 실행
 * - 로딩 상태 표시
 * - Clear 버튼
 */

'use client';

import React from 'react';
import {
  TextField,
  Button,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useSearch } from '@/presentation/store/use-search';

interface SearchBarProps {
  onFilterToggle?: () => void;
  isMobile?: boolean;
}

export default function SearchBar({
  onFilterToggle,
  isMobile,
}: SearchBarProps) {
  const {
    searchQuery,
    loading,
    canSearch,
    activeFiltersCount,
    setSearchQuery,
    search,
    resetAll,
  } = useSearch();

  // 디버그: canSearch 상태 확인
  React.useEffect(() => {
    console.log('[SearchBar] searchQuery:', searchQuery);
    console.log('[SearchBar] canSearch:', canSearch);
    console.log('[SearchBar] loading:', loading);
  }, [searchQuery, canSearch, loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSearch) return;

    try {
      await search();
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleClear = () => {
    resetAll();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSearch(e as unknown as React.FormEvent);
    }
  };

  return (
    <Paper component="form" onSubmit={handleSearch} elevation={0}>
      <div className="flex gap-2">
        {/* 필터 토글 버튼 */}
        {isMobile && onFilterToggle && (
          <Tooltip
            title={`Filters ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}
          >
            <IconButton
              onClick={onFilterToggle}
              size="large"
              disabled={loading}
              className="xl:hidden"
              sx={{
                borderRadius: 1,
                width: 56,
                height: 56,
                bgcolor: 'action.hover',
                position: 'relative',
              }}
            >
              <FilterListIcon />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </IconButton>
          </Tooltip>
        )}

        <TextField
          fullWidth
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search GitHub users... (e.g., react, typescript, Seoul)"
          variant="outlined"
          size="medium"
          disabled={loading}
          InputProps={{
            startAdornment: !isMobile && (
              <InputAdornment position="start">
                <SearchIcon className="text-gray-400" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <Tooltip title="Clear search">
                  <IconButton
                    onClick={handleClear}
                    edge="end"
                    size="small"
                    disabled={loading}
                  >
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
          sx={{
            '& input': {
              borderRadius: '0 !important',
              paddingLeft: isMobile ? 2 : 1,
            },
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        {/* 검색 버튼 */}
        {isMobile ? (
          <IconButton
            type="submit"
            size="large"
            disabled={!canSearch}
            sx={{
              borderRadius: 1,
              width: 56,
              height: 56,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
              '&.Mui-disabled': {
                bgcolor: 'action.disabledBackground',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <SearchIcon />
            )}
          </IconButton>
        ) : (
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!canSearch}
            sx={{
              minWidth: 160,
              height: 56,
              textTransform: 'none',
              fontWeight: 'semibold',
              fontSize: '1.125rem',
              paddingBottom: '0.625rem',
            }}
          >
            {loading ? '검색 중...' : '검색'}
          </Button>
        )}
      </div>

      {/* 검색 힌트 */}
      {!searchQuery && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Try: "javascript developer", "react Seoul", "typescript
          followers:&gt;100"
        </div>
      )}
    </Paper>
  );
}
