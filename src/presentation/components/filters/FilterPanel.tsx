/**
 * 필터 패널 컴포넌트
 * - 8가지 검색 필터 UI
 * - MUI Select, TextField, Checkbox 사용
 * - Accordion으로 그룹화
 */

'use client';

import React, { useState } from 'react';
import {
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  Chip,
  FormGroup,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useSearch } from '@/presentation/store/use-search';
import {
  SearchFilters,
  UserType,
  SearchInField,
  SortOption,
  SortOrder,
} from '@/domain/types/filters';

export default function FilterPanel() {
  const { filters, updateFilters, resetSearch, search } = useSearch();

  // 로컬 상태 (Apply 버튼 누를 때까지 임시 저장)
  const [localFilters, setLocalFilters] =
    useState<Partial<SearchFilters>>(filters);

  const handleApplyFilters = async () => {
    console.log('[FilterPanel] Apply filters:', localFilters);

    // 먼저 filters 상태 업데이트
    updateFilters(localFilters);

    // localFilters를 직접 전달하여 검색 실행
    try {
      await search(localFilters); // ← 직접 전달!
      console.log('[FilterPanel] Search completed');
    } catch (error) {
      console.error('[FilterPanel] Search failed:', error);
    }
  };

  const handleResetFilters = () => {
    setLocalFilters({});
    resetSearch();
  };

  const updateLocalFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Paper elevation={0} sx={{ backgroundColor: 'transparent' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FilterAltIcon className="text-primary" />
          <Typography variant="h6" className="font-bold">
            Filters
          </Typography>
        </div>
        <Button
          size="small"
          startIcon={<RestartAltIcon />}
          onClick={handleResetFilters}
          disabled={Object.keys(localFilters).length === 0}
        >
          Reset
        </Button>
      </div>

      <Divider className="mb-4" />

      {/* 1. 사용자/조직 필터 */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">1. User Type</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              value={localFilters.type || ''}
              label="Type"
              onChange={e =>
                updateLocalFilter('type', e.target.value as UserType)
              }
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="org">Organization</MenuItem>
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* 2. 검색 대상 필드 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">2. Search In</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.searchIn?.includes('login') || false}
                  onChange={e => {
                    const current = localFilters.searchIn || [];
                    const updated = e.target.checked
                      ? [...current, 'login' as SearchInField]
                      : current.filter(f => f !== 'login');
                    updateLocalFilter('searchIn', updated);
                  }}
                />
              }
              label="Login (Username)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.searchIn?.includes('name') || false}
                  onChange={e => {
                    const current = localFilters.searchIn || [];
                    const updated = e.target.checked
                      ? [...current, 'name' as SearchInField]
                      : current.filter(f => f !== 'name');
                    updateLocalFilter('searchIn', updated);
                  }}
                />
              }
              label="Name"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={localFilters.searchIn?.includes('email') || false}
                  onChange={e => {
                    const current = localFilters.searchIn || [];
                    const updated = e.target.checked
                      ? [...current, 'email' as SearchInField]
                      : current.filter(f => f !== 'email');
                    updateLocalFilter('searchIn', updated);
                  }}
                />
              }
              label="Email"
            />
          </FormGroup>
        </AccordionDetails>
      </Accordion>

      {/* 3. 리포지토리 수 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">3. Repositories</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="flex gap-2">
            <TextField
              label="Min"
              type="number"
              size="small"
              fullWidth
              value={localFilters.repos?.min || ''}
              onChange={e =>
                updateLocalFilter('repos', {
                  ...localFilters.repos,
                  min: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              fullWidth
              value={localFilters.repos?.max || ''}
              onChange={e =>
                updateLocalFilter('repos', {
                  ...localFilters.repos,
                  max: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              inputProps={{ min: 0 }}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* 4. 위치 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">4. Location</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            label="Location"
            size="small"
            fullWidth
            placeholder="e.g., Seoul, San Francisco"
            value={localFilters.location || ''}
            onChange={e => updateLocalFilter('location', e.target.value)}
          />
        </AccordionDetails>
      </Accordion>

      {/* 5. 언어 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">5. Language</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth size="small">
            <InputLabel>Language</InputLabel>
            <Select
              value={localFilters.language || ''}
              label="Language"
              onChange={e => updateLocalFilter('language', e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="JavaScript">JavaScript</MenuItem>
              <MenuItem value="TypeScript">TypeScript</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
              <MenuItem value="Java">Java</MenuItem>
              <MenuItem value="Go">Go</MenuItem>
              <MenuItem value="Rust">Rust</MenuItem>
              <MenuItem value="C++">C++</MenuItem>
              <MenuItem value="Ruby">Ruby</MenuItem>
              <MenuItem value="PHP">PHP</MenuItem>
            </Select>
          </FormControl>
        </AccordionDetails>
      </Accordion>

      {/* 6. 가입일 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">6. Created Date</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="flex gap-2">
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={localFilters.created?.from || ''}
              onChange={e =>
                updateLocalFilter('created', {
                  ...localFilters.created,
                  from: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={localFilters.created?.to || ''}
              onChange={e =>
                updateLocalFilter('created', {
                  ...localFilters.created,
                  to: e.target.value,
                })
              }
              InputLabelProps={{ shrink: true }}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* 7. 팔로워 수 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">7. Followers</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div className="flex gap-2">
            <TextField
              label="Min"
              type="number"
              size="small"
              fullWidth
              value={localFilters.followers?.min || ''}
              onChange={e =>
                updateLocalFilter('followers', {
                  ...localFilters.followers,
                  min: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              inputProps={{ min: 0 }}
            />
            <TextField
              label="Max"
              type="number"
              size="small"
              fullWidth
              value={localFilters.followers?.max || ''}
              onChange={e =>
                updateLocalFilter('followers', {
                  ...localFilters.followers,
                  max: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              inputProps={{ min: 0 }}
            />
          </div>
        </AccordionDetails>
      </Accordion>

      {/* 8. 후원 가능 여부 */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography className="font-semibold">8. Sponsorable</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Checkbox
                checked={localFilters.isSponsored || false}
                onChange={e =>
                  updateLocalFilter('isSponsored', e.target.checked)
                }
              />
            }
            label="Only show sponsorable users"
          />
        </AccordionDetails>
      </Accordion>

      {/* 정렬 옵션 */}
      <Box className="mt-4">
        <Typography variant="subtitle2" className="mb-2 font-semibold">
          Sort By
        </Typography>
        <div className="flex gap-2 mb-2">
          <FormControl fullWidth size="small">
            <InputLabel>Sort</InputLabel>
            <Select
              value={localFilters.sort || 'best-match'}
              label="Sort"
              onChange={e =>
                updateLocalFilter('sort', e.target.value as SortOption)
              }
            >
              <MenuItem value="best-match">Best Match</MenuItem>
              <MenuItem value="followers">Followers</MenuItem>
              <MenuItem value="repositories">Repositories</MenuItem>
              <MenuItem value="joined">Joined Date</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Order</InputLabel>
            <Select
              value={localFilters.sortOrder || 'desc'}
              label="Order"
              onChange={e =>
                updateLocalFilter('sortOrder', e.target.value as SortOrder)
              }
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </div>
      </Box>

      <Divider className="my-4" />

      {/* Apply 버튼 */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        startIcon={<FilterAltIcon />}
        onClick={handleApplyFilters}
        sx={{
          bgcolor: 'text.primary',
          color: 'background.paper',
          '&:hover': {
            bgcolor: 'text.secondary',
            opacity: 0.9,
          },
          textTransform: 'none',
          fontWeight: 'bold',
        }}
      >
        Apply Filters
      </Button>

      {/* 활성화된 필터 표시 */}
      {Object.keys(localFilters).length > 0 && (
        <Box className="mt-4">
          <Typography
            variant="caption"
            className="text-gray-500 dark:text-gray-400 mb-2 block"
          >
            Active Filters:
          </Typography>
          <div className="flex flex-wrap gap-1">
            {localFilters.type && (
              <Chip
                label={`Type: ${localFilters.type}`}
                size="small"
                onDelete={() => updateLocalFilter('type', undefined)}
              />
            )}
            {localFilters.location && (
              <Chip
                label={`Location: ${localFilters.location}`}
                size="small"
                onDelete={() => updateLocalFilter('location', undefined)}
              />
            )}
            {localFilters.language && (
              <Chip
                label={`Language: ${localFilters.language}`}
                size="small"
                onDelete={() => updateLocalFilter('language', undefined)}
              />
            )}
            {localFilters.repos && (
              <Chip
                label={`Repos: ${localFilters.repos.min || 0}-${localFilters.repos.max || '∞'}`}
                size="small"
                onDelete={() => updateLocalFilter('repos', undefined)}
              />
            )}
            {localFilters.followers && (
              <Chip
                label={`Followers: ${localFilters.followers.min || 0}-${localFilters.followers.max || '∞'}`}
                size="small"
                onDelete={() => updateLocalFilter('followers', undefined)}
              />
            )}
          </div>
        </Box>
      )}
    </Paper>
  );
}
