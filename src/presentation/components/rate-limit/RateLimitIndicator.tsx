/**
 * Rate Limit 표시 컴포넌트
 * - GitHub API Rate Limit 정보 표시
 * - 경고 알림
 * - 다크모드 지원
 */

'use client';

import React, { useEffect } from 'react';
import {
  Alert,
  AlertTitle,
  LinearProgress,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useSearch } from '@/presentation/store/use-search';

export default function RateLimitIndicator() {
  const { rateLimit, rateLimitPercentage, isRateLimitLow, fetchRateLimit } =
    useSearch();

  const [open, setOpen] = React.useState(true);

  // 초기 Rate Limit 조회
  useEffect(() => {
    fetchRateLimit();
  }, [fetchRateLimit]);

  // Rate Limit이 없으면 표시 안함
  if (!rateLimit) return null;

  // Rate Limit이 충분하면 표시 안함 (>50%)
  if (rateLimitPercentage > 0.5 && open) {
    return (
      <Box className="mb-4">
        <Chip
          icon={<InfoOutlinedIcon />}
          label={`API: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`}
          size="small"
          variant="outlined"
          className="text-gray-600 dark:text-gray-400"
        />
      </Box>
    );
  }

  // Rate Limit 경고 표시
  const resetDate = new Date(rateLimit.reset * 1000);
  const resetTimeString = resetDate.toLocaleTimeString();

  const color = isRateLimitLow
    ? 'error'
    : rateLimitPercentage < 0.3
      ? 'warning'
      : 'success';

  return (
    <Collapse in={open}>
      <Box className="mb-6 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative">
        <IconButton
          aria-label="close"
          size="small"
          onClick={() => setOpen(false)}
          className="absolute top-2 right-2"
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <div className="flex justify-between items-center mb-2 pr-6">
          <div className="flex items-center gap-2">
            {isRateLimitLow ? (
              <WarningAmberIcon color="error" />
            ) : (
              <InfoOutlinedIcon className="text-gray-400" />
            )}
            <Typography
              variant="subtitle2"
              className="font-semibold text-gray-700 dark:text-gray-300"
            >
              API Quota (Search)
            </Typography>
          </div>
          <Typography variant="caption" className="text-gray-500 font-mono">
            {rateLimit.remaining} / {rateLimit.limit}
          </Typography>
        </div>

        <LinearProgress
          variant="determinate"
          value={rateLimitPercentage * 100}
          color={color as any}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />

        <div className="flex justify-between items-center">
          <Typography
            variant="caption"
            className="text-gray-500 dark:text-gray-400"
          >
            {isRateLimitLow
              ? 'Rate limit low. Please wait.'
              : 'Requests remaining'}
          </Typography>
          <Typography
            variant="caption"
            className="text-gray-500 dark:text-gray-400"
          >
            Resets at {resetTimeString}
          </Typography>
        </div>
      </Box>
    </Collapse>
  );
}
