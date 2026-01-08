/**
 * 검색바 컴포넌트
 * - 기본 검색어 입력
 * - 검색 실행
 * - useSearch 커스텀 훅 사용
 */

'use client';

import React from 'react';
import { TextField, Button, Paper, CircularProgress } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useSearch } from '@/presentation/store/use-search';

export default function SearchBar() {
  const { searchQuery, loading, canSearch, setSearchQuery, search, resetAll } =
    useSearch();

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

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      className="flex gap-2 p-4"
      elevation={2}
    >
      <TextField
        fullWidth
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search GitHub users... (e.g., react, typescript, Seoul)"
        variant="outlined"
        size="medium"
        disabled={loading}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />

      {searchQuery && (
        <Button
          onClick={handleClear}
          variant="outlined"
          size="large"
          disabled={loading}
          sx={{
            minWidth: 60,
            borderRadius: 2,
          }}
        >
          <ClearIcon />
        </Button>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!canSearch}
        startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
        sx={{
          minWidth: 120,
          borderRadius: 2,
        }}
      >
        {loading ? 'Searching...' : 'Search'}
      </Button>
    </Paper>
  );
}
