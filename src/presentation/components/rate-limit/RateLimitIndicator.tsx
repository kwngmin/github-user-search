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

  return (
    <Collapse in={open}>
      <Alert
        severity={isRateLimitLow ? 'error' : 'warning'}
        icon={<WarningAmberIcon />}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={() => setOpen(false)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        className="mb-4"
      >
        <AlertTitle className="font-bold">
          {isRateLimitLow ? 'Rate Limit Critical' : 'Rate Limit Warning'}
        </AlertTitle>

        <Typography variant="body2" className="mb-2">
          {rateLimit.remaining} of {rateLimit.limit} API requests remaining
          {isRateLimitLow && ' - Please wait before making more searches'}
        </Typography>

        {/* Progress Bar */}
        <Box className="mb-2">
          <LinearProgress
            variant="determinate"
            value={rateLimitPercentage * 100}
            color={isRateLimitLow ? 'error' : 'warning'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        <Typography
          variant="caption"
          className="text-gray-600 dark:text-gray-400"
        >
          Resets at {resetTimeString}
        </Typography>
      </Alert>
    </Collapse>
  );
}
