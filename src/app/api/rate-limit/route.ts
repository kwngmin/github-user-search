/**
 * GitHub Rate Limit 조회 API 라우트 핸들러
 * GET /api/rate-limit
 *
 * - 현재 Rate Limit 상태 조회
 * - 캐싱 없이 실시간 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { GitHubApiClient } from '@/lib/github-api-client';
import { createErrorResponse } from '@/lib/api-error';

/**
 * GET 요청 핸들러
 */
export async function GET(request: NextRequest) {
  try {
    // 1. GitHub API 클라이언트 생성
    const client = new GitHubApiClient();

    // 2. Rate Limit 정보 조회
    const rateLimit = await client.getRateLimit();

    // 3. 성공 응답 반환
    return NextResponse.json(rateLimit, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    // 4. 에러 응답 반환
    console.error('[API /api/rate-limit] Error:', error);
    return createErrorResponse(error, 'Failed to fetch rate limit');
  }
}

/**
 * POST 요청 핸들러 (지원하지 않음)
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use GET instead.',
    },
    { status: 405 }
  );
}
