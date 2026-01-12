/**
 * 사용자 카드 컴포넌트
 * - MUI Card 사용
 * - GitHub 사용자 정보 표시
 * - Canvas를 사용한 아바타 이미지 렌더링
 * - 다크모드 지원
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Box,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import CodeIcon from '@mui/icons-material/Code';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { GitHubUser } from '@/domain/entities/user';

interface UserCardProps {
  user: GitHubUser;
}

export default function UserCard({ user }: UserCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas로 아바타 이미지 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = user.avatarUrl;

    img.onload = () => {
      // 1. Canvas에 원본 이미지 그리기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. 픽셀 데이터 추출 (RGBA)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      /**
       * 3. WebAssembly(Rust) 처리 시뮬레이션
       * - 아키텍처 가이드에 따라 픽셀 단위 처리를 수행합니다.
       * - 실제 Rust WASM 모듈이 연결되면 이 루프는 WASM 함수 호출로 대체됩니다.
       * - 현재는 시각적 결과를 유지하며 픽셀을 순회하는 구조를 구현합니다.
       */
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        // R, G, B, A 데이터를 명시적으로 처리 (Pass-through)
        // 향후 WASM에서 그레이스케일, 대비 조정 등의 필터 적용 가능
        data[i] = data[i]; // Red
        data[i + 1] = data[i + 1]; // Green
        data[i + 2] = data[i + 2]; // Blue
        data[i + 3] = data[i + 3]; // Alpha
      }

      // 4. 처리된 데이터를 다시 Canvas에 렌더링
      ctx.putImageData(imageData, 0, 0);

      // 5. 원형 마스크 적용
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        Math.PI * 2
      );
      ctx.closePath();
      ctx.fill();

      // 6. 합성 모드 초기화 (다른 그리기 작업에 영향을 주지 않도록)
      ctx.globalCompositeOperation = 'source-over';
    };

    img.onerror = () => {
      // 이미지 로드 실패 시 폴백
      console.error('Failed to load avatar:', user.avatarUrl);
    };
  }, [user.avatarUrl]);

  return (
    <Card
      className="h-full hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-300 group relative"
      variant="outlined"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
      }}
    >
      <CardContent className="flex-1" sx={{ padding: 3 }}>
        {/* 헤더: 아바타 및 기본 정보 */}
        <div className="flex items-start gap-3 mb-3">
          <Box position="relative">
            <canvas
              ref={canvasRef}
              width={80}
              height={80}
              className="rounded-full border border-gray-300 dark:border-gray-700"
              style={{ display: 'block' }}
            />
            {user.isSponsored && (
              <Tooltip title="Sponsorable">
                <Box
                  position="absolute"
                  bottom={0}
                  right={0}
                  className="bg-pink-500 rounded-full p-1"
                >
                  <StarIcon sx={{ fontSize: 16, color: 'white' }} />
                </Box>
              </Tooltip>
            )}
          </Box>

          <div className="flex-1 min-w-0">
            <Typography
              variant="h6"
              className="font-bold truncate"
              sx={{ fontSize: '1.1rem' }}
            >
              {user.name || user.login}
            </Typography>
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-400 truncate"
            >
              @{user.login}
            </Typography>
            <Chip
              label={user.type}
              size="small"
              color={user.type === 'User' ? 'primary' : 'secondary'}
              // variant="outlined"
              sx={{
                mt: 1,
                height: '1.25rem',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'flex-start',
                width: 'fit-content',
                fontWeight: 'bold',
                paddingTop: '1px',
              }}
            />
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <Typography
            variant="body2"
            className="text-gray-700 dark:text-gray-300 mb-3 line-clamp-2"
            sx={{ minHeight: 40 }}
          >
            {user.bio}
          </Typography>
        )}

        {/* 위치 및 회사 */}
        <div className="flex flex-col gap-1 mb-3">
          {user.location && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <LocationOnIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">{user.location}</Typography>
            </div>
          )}
          {user.company && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <BusinessIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">{user.company}</Typography>
            </div>
          )}
          {user.email && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <EmailIcon sx={{ fontSize: 16 }} />
              <Typography
                variant="caption"
                className="truncate hover:underline cursor-pointer"
                component="a"
                href={`mailto:${user.email}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.email}
              </Typography>
            </div>
          )}
          {user.blog && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <LinkIcon sx={{ fontSize: 16 }} />
              <Typography
                variant="caption"
                className="truncate hover:underline cursor-pointer"
                component="a"
                href={
                  user.blog.startsWith('http')
                    ? user.blog
                    : `https://${user.blog}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.blog}
              </Typography>
            </div>
          )}
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <Tooltip title="Public Repositories">
            <Box className="text-center">
              <Typography variant="h6" className="font-bold text-sm">
                {user.publicRepos !== undefined ? user.publicRepos : '-'}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-600 dark:text-gray-400"
              >
                Repositories
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Followers">
            <Box className="text-center">
              <Typography variant="h6" className="font-bold text-sm">
                {user.followers !== undefined
                  ? user.followers >= 1000
                    ? `${(user.followers / 1000).toFixed(1)}k`
                    : user.followers
                  : '-'}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-600 dark:text-gray-400"
              >
                Followers
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Following">
            <Box className="text-center">
              <Typography variant="h6" className="font-bold text-sm">
                {user.following !== undefined
                  ? user.following >= 1000
                    ? `${(user.following / 1000).toFixed(1)}k`
                    : user.following
                  : '-'}
              </Typography>
              <Typography
                variant="caption"
                className="text-gray-600 dark:text-gray-400"
              >
                Following
              </Typography>
            </Box>
          </Tooltip>
        </div>

        {/* 가입일 */}
        {user.createdAt && (
          <Typography
            variant="caption"
            className="text-gray-500 dark:text-gray-500 mt-2 block text-center"
          >
            Joined{' '}
            {new Date(user.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </Typography>
        )}
      </CardContent>

      {/* 액션 버튼 */}
      <CardActions
        disableSpacing
        className="p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out absolute bottom-0 left-0 right-0 flex flex-col"
      >
        <Box
          sx={{
            width: '100%',
            height: 96,
            background: theme =>
              `linear-gradient(to top, ${theme.palette.background.paper}, transparent)`,
          }}
        ></Box>
        <Button
          fullWidth
          variant="contained"
          endIcon={<OpenInNewIcon />}
          href={user.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            textTransform: 'none',
            borderRadius: 0,
            height: 48,
            bgcolor: 'text.primary',
            color: 'background.paper',
            '&:hover': {
              bgcolor: 'text.secondary',
              opacity: 0.9,
            },
          }}
        >
          View Profile
        </Button>
      </CardActions>
    </Card>
  );
}
