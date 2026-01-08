/**
 * 사용자 카드 컴포넌트
 * - GitHub 사용자 정보 표시
 * - Canvas를 사용한 아바타 이미지 렌더링 (추후 WebAssembly 추가)
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Box,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
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
      // Canvas에 이미지 그리기
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 원형 마스크 적용
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
    };
  }, [user.avatarUrl]);

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="flex flex-col gap-3">
        {/* 아바타 및 기본 정보 */}
        <div className="flex items-start gap-3">
          <canvas
            ref={canvasRef}
            width={64}
            height={64}
            className="rounded-full"
            style={{ display: 'block' }}
          />
          <div className="flex-1 min-w-0">
            <Typography variant="h6" className="font-bold truncate">
              {user.name || user.login}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              className="truncate"
            >
              @{user.login}
            </Typography>
          </div>
          <Chip
            label={user.type}
            size="small"
            color={user.type === 'User' ? 'primary' : 'secondary'}
          />
        </div>

        {/* Bio */}
        {user.bio && (
          <Typography
            variant="body2"
            color="text.secondary"
            className="line-clamp-2"
          >
            {user.bio}
          </Typography>
        )}

        {/* 위치 및 회사 */}
        <Box className="flex flex-wrap gap-2">
          {user.location && (
            <Chip
              icon={<LocationOnIcon />}
              label={user.location}
              size="small"
              variant="outlined"
            />
          )}
          {user.company && (
            <Chip
              icon={<BusinessIcon />}
              label={user.company}
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        {/* 통계 */}
        <div className="flex gap-4 mt-2">
          <Box className="text-center">
            <Typography variant="h6" className="font-bold">
              {user.publicRepos}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Repos
            </Typography>
          </Box>
          <Box className="text-center">
            <Typography variant="h6" className="font-bold">
              {user.followers}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Followers
            </Typography>
          </Box>
          <Box className="text-center">
            <Typography variant="h6" className="font-bold">
              {user.following}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Following
            </Typography>
          </Box>
        </div>
      </CardContent>
    </Card>
  );
}
