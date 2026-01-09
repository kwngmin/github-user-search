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
}

export default function SearchBar({ onFilterToggle }: SearchBarProps) {
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
    <Paper
      component="form"
      onSubmit={handleSearch}
      elevation={2}
      className="p-4 bg-white dark:bg-gray-800"
      sx={{
        borderRadius: 2,
      }}
    >
      <div className="flex gap-2">
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
            startAdornment: (
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
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />

        {/* 필터 토글 버튼 */}
        {onFilterToggle && (
          <Tooltip
            title={`Filters ${activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}`}
          >
            <Button
              onClick={onFilterToggle}
              variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
              size="large"
              disabled={loading}
              sx={{
                minWidth: 60,
                position: 'relative',
              }}
            >
              <FilterListIcon />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-main text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </Tooltip>
        )}

        {/* 검색 버튼 */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!canSearch}
          startIcon={
            loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SearchIcon />
            )
          }
          sx={{
            minWidth: 120,
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
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
