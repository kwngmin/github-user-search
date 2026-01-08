/**
 * GitHub 사용자 검색 API 라우트 핸들러
 * POST /api/search/users
 *
 * - Authorization token 사용
 * - Rate limit 처리
 * - 에러 핸들링
 */

import { NextRequest, NextResponse } from 'next/server';
import { SearchFilters } from '@/domain/types/filters';
import { GitHubApiClient } from '@/lib/github-api-client';
import {
  createErrorResponse,
  parseRequestBody,
  ApiError,
} from '@/lib/api-error';

/**
 * POST 요청 핸들러
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Request Body 파싱
    const filters = await parseRequestBody<SearchFilters>(request);

    // 2. 입력 검증
    validateSearchFilters(filters);

    // 3. GitHub API 클라이언트 생성
    const client = new GitHubApiClient();

    // 4. 사용자 검색 실행
    const result = await client.searchUsers(filters);

    // 5. 성공 응답 반환
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    // 6. 에러 응답 반환
    console.error('[API /api/search/users] Error:', error);
    return createErrorResponse(error, 'Failed to search users');
  }
}

/**
 * GET 요청 핸들러 (지원하지 않음)
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use POST instead.',
    },
    { status: 405 }
  );
}

/**
 * 검색 필터 유효성 검증
 */
function validateSearchFilters(filters: SearchFilters): void {
  // 검색어 필수
  if (!filters.query || filters.query.trim().length === 0) {
    throw new ApiError('Search query is required', 400, 'MISSING_QUERY');
  }

  // 검색어 길이 제한
  if (filters.query.length > 256) {
    throw new ApiError(
      'Search query is too long (max 256 characters)',
      400,
      'QUERY_TOO_LONG'
    );
  }

  // 페이지 번호 검증
  if (filters.page !== undefined) {
    if (!Number.isInteger(filters.page) || filters.page < 1) {
      throw new ApiError(
        'Page must be a positive integer',
        400,
        'INVALID_PAGE'
      );
    }

    // GitHub API 제한: 최대 1000개 결과 (page * perPage <= 1000)
    const maxPage = Math.floor(1000 / (filters.perPage || 30));
    if (filters.page > maxPage) {
      throw new ApiError(
        `Page number too high (max ${maxPage} for current perPage)`,
        400,
        'PAGE_TOO_HIGH'
      );
    }
  }

  // perPage 검증 (GitHub API 제한: 1-100)
  if (filters.perPage !== undefined) {
    if (
      !Number.isInteger(filters.perPage) ||
      filters.perPage < 1 ||
      filters.perPage > 100
    ) {
      throw new ApiError(
        'perPage must be between 1 and 100',
        400,
        'INVALID_PER_PAGE'
      );
    }
  }

  // 범위 필터 검증
  if (filters.repos) {
    validateRangeFilter(filters.repos, 'repos');
  }

  if (filters.followers) {
    validateRangeFilter(filters.followers, 'followers');
  }

  // 날짜 형식 검증
  if (filters.created) {
    if (filters.created.from && !isValidDate(filters.created.from)) {
      throw new ApiError(
        'Invalid date format for created.from (use YYYY-MM-DD)',
        400,
        'INVALID_DATE_FORMAT'
      );
    }
    if (filters.created.to && !isValidDate(filters.created.to)) {
      throw new ApiError(
        'Invalid date format for created.to (use YYYY-MM-DD)',
        400,
        'INVALID_DATE_FORMAT'
      );
    }
  }
}

/**
 * 범위 필터 유효성 검증
 */
function validateRangeFilter(
  range: { min?: number; max?: number; exact?: number },
  fieldName: string
): void {
  if (
    range.min !== undefined &&
    (!Number.isInteger(range.min) || range.min < 0)
  ) {
    throw new ApiError(
      `${fieldName}.min must be a non-negative integer`,
      400,
      'INVALID_RANGE'
    );
  }

  if (
    range.max !== undefined &&
    (!Number.isInteger(range.max) || range.max < 0)
  ) {
    throw new ApiError(
      `${fieldName}.max must be a non-negative integer`,
      400,
      'INVALID_RANGE'
    );
  }

  if (
    range.min !== undefined &&
    range.max !== undefined &&
    range.min > range.max
  ) {
    throw new ApiError(
      `${fieldName}.min cannot be greater than ${fieldName}.max`,
      400,
      'INVALID_RANGE'
    );
  }

  if (
    range.exact !== undefined &&
    (!Number.isInteger(range.exact) || range.exact < 0)
  ) {
    throw new ApiError(
      `${fieldName}.exact must be a non-negative integer`,
      400,
      'INVALID_RANGE'
    );
  }
}

/**
 * 날짜 형식 검증 (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
