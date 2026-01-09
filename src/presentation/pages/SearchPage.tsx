/**
 * GitHub 사용자 검색 페이지
 * - 모든 컴포넌트 통합
 * - 레이아웃: Tailwind CSS Grid
 * - 다크모드 지원
 */

'use client';

import React, { useState } from 'react';
import {
  Container,
  Box,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchBar from '@/presentation/components/SearchBar';
import FilterPanel from '@/presentation/components/filters/FilterPanel';
import UserList from '@/presentation/components/user/UserList';
import RateLimitIndicator from '@/presentation/components/rate-limit/RateLimitIndicator';

export default function SearchPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Container maxWidth="xl" className="py-6">
      {/* 헤더 */}
      <Box className="mb-6">
        <Typography
          variant="h3"
          className="font-bold mb-2 text-gray-900 dark:text-white"
        >
          GitHub User Search
        </Typography>
        <Typography
          variant="body1"
          className="text-gray-600 dark:text-gray-400"
        >
          Search and discover GitHub users with advanced filters
        </Typography>
      </Box>

      {/* Rate Limit 표시 */}
      <RateLimitIndicator />

      {/* 검색바 */}
      <Box className="mb-6">
        <SearchBar onFilterToggle={() => setFilterOpen(!filterOpen)} />
      </Box>

      {/* 메인 레이아웃: Tailwind Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 필터 패널 - 데스크톱 */}
        {!isMobile && (
          <aside className="lg:col-span-1">
            <div className="sticky top-6">
              <FilterPanel />
            </div>
          </aside>
        )}

        {/* 필터 패널 - 모바일 (Drawer) */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            sx={{
              '& .MuiDrawer-paper': {
                width: '90%',
                maxWidth: 400,
              },
            }}
          >
            <Box className="p-4">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h6" className="font-bold">
                  Filters
                </Typography>
                <IconButton onClick={() => setFilterOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </div>
              <FilterPanel />
            </Box>
          </Drawer>
        )}

        {/* 사용자 목록 */}
        <main className="lg:col-span-3">
          <UserList />
        </main>
      </div>
    </Container>
  );
}
