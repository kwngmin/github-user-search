/**
 * 검색바 컴포넌트
 * - 기본 검색어 입력
 * - 검색 실행
 */

'use client';

import React, { useState } from 'react';
import { TextField, Button, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAppDispatch } from '@/presentation/store';
import {
  updateFilters,
  resetSearch,
  searchUsers,
} from '@/presentation/store/search-slice';

export default function SearchBar() {
  const dispatch = useAppDispatch();
  const [query, setQuery] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // 검색 초기화 및 필터 업데이트
    dispatch(resetSearch());
    dispatch(updateFilters({ query: query.trim() }));

    // 검색 실행
    await dispatch(searchUsers({ query: query.trim(), page: 1, perPage: 30 }));
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
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search GitHub users..."
        variant="outlined"
        size="medium"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        startIcon={<SearchIcon />}
        sx={{
          minWidth: 120,
          borderRadius: 2,
        }}
      >
        Search
      </Button>
    </Paper>
  );
}
