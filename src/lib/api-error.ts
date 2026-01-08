/**
 * API 에러 핸들링 유틸리티
 * - Next.js App Router API 라우트용
 * - GitHub API 에러 처리
 */

import { NextResponse } from 'next/server';

/**
 * API 에러 클래스
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * GitHub API 에러 응답 타입
 */
interface GitHubErrorResponse {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

/**
 * 에러 응답 생성
 */
export function createErrorResponse(
  error: unknown,
  fallbackMessage = 'Internal server error'
): NextResponse {
  // ApiError 인스턴스
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  // 일반 Error 인스턴스
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message || fallbackMessage,
      },
      { status: 500 }
    );
  }

  // 알 수 없는 에러
  return NextResponse.json(
    {
      error: fallbackMessage,
    },
    { status: 500 }
  );
}

/**
 * GitHub API 에러 파싱
 */
export function parseGitHubError(
  response: Response,
  data: GitHubErrorResponse
): ApiError {
  const message = data.message || 'GitHub API error';

  // Rate Limit 에러
  if (response.status === 403) {
    const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
    if (rateLimitRemaining === '0') {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const resetDate = resetTime
        ? new Date(parseInt(resetTime) * 1000).toLocaleString()
        : 'unknown';

      return new ApiError(
        `Rate limit exceeded. Resets at ${resetDate}`,
        403,
        'RATE_LIMIT_EXCEEDED'
      );
    }
  }

  // 인증 에러
  if (response.status === 401) {
    return new ApiError(
      'GitHub API authentication failed. Check your token.',
      401,
      'AUTHENTICATION_FAILED'
    );
  }

  // 리소스를 찾을 수 없음
  if (response.status === 404) {
    return new ApiError('Resource not found', 404, 'NOT_FOUND');
  }

  // 잘못된 요청
  if (response.status === 422) {
    return new ApiError(
      `Validation failed: ${message}`,
      422,
      'VALIDATION_ERROR'
    );
  }

  // 기타 에러
  return new ApiError(message, response.status, 'GITHUB_API_ERROR');
}

/**
 * Request body 파싱 (에러 핸들링 포함)
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new ApiError('Invalid JSON in request body', 400, 'INVALID_JSON');
  }
}

/**
 * 환경변수 검증
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new ApiError(
      `Missing required environment variable: ${key}`,
      500,
      'MISSING_ENV_VAR'
    );
  }

  return value;
}
