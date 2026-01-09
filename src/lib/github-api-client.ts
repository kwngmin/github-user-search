/**
 * GitHub API 클라이언트 (서버 전용)
 * - Next.js App Router API 라우트에서 사용
 * - Rate Limit 처리 및 재시도 로직
 */

import { SearchFilters, SearchQuery } from '@/domain/types/filters';
import { SearchResult, RateLimit } from '@/domain/entities/user';
import { SearchQueryBuilder } from '@/application/use-cases/query-builder';
import { GitHubApiMapper } from '@/infrastructure/api/github-mapper';
import {
  GitHubSearchResponse,
  GitHubRateLimitResponse,
  GitHubApiError,
} from '@/infrastructure/api/github-types';
import { ApiError, parseGitHubError, getRequiredEnv } from './api-error';

/**
 * Retry 설정
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

/**
 * GitHub API 클라이언트 클래스
 */
export class GitHubApiClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly token: string;
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  constructor(token?: string) {
    // 환경변수에서 토큰 가져오기
    this.token = token || getRequiredEnv('GITHUB_TOKEN');
  }

  /**
   * 사용자 검색
   */
  async searchUsers(
    filters: SearchFilters
  ): Promise<{ data: SearchResult; headers: Headers }> {
    // 쿼리 빌더로 API 파라미터 생성
    const query = SearchQueryBuilder.build(filters);

    // URL 파라미터 생성
    const params = new URLSearchParams();
    params.append('q', query.q);

    if (query.sort) params.append('sort', query.sort);
    if (query.order) params.append('order', query.order);
    if (query.page) params.append('page', query.page.toString());
    if (query.per_page) params.append('per_page', query.per_page.toString());

    const url = `${this.baseUrl}/search/users?${params.toString()}`;

    // API 호출 (재시도 로직 포함)
    const { data: apiResponse, headers } =
      await this.fetchWithRetry<GitHubSearchResponse>(url);

    // Domain 엔티티로 변환
    const result = GitHubApiMapper.toSearchResult(
      apiResponse,
      query.page || 1,
      query.per_page || 30
    );

    return { data: result, headers };
  }

  /**
   * Rate Limit 정보 조회
   */
  async getRateLimit(): Promise<{ data: RateLimit; headers: Headers }> {
    const url = `${this.baseUrl}/rate_limit`;
    const { data: apiResponse, headers } =
      await this.fetchWithRetry<GitHubRateLimitResponse>(url);

    return {
      data: GitHubApiMapper.toRateLimit(apiResponse),
      headers,
    };
  }

  /**
   * Exponential Backoff를 적용한 재시도 로직
   */
  private async fetchWithRetry<T>(
    url: string,
    retryCount = 0
  ): Promise<{ data: T; headers: Headers }> {
    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
        // Next.js의 fetch cache 설정
        cache: 'no-store',
      });

      // Rate Limit 체크
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');

      // Rate Limit 초과 (403 Forbidden)
      if (response.status === 403 && rateLimitRemaining === '0') {
        if (retryCount < this.retryConfig.maxRetries) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          const delay = this.calculateBackoffDelay(retryCount, resetTime);

          console.warn(
            `[GitHub API] Rate limit exceeded. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);

          return this.fetchWithRetry<T>(url, retryCount + 1);
        }

        // 최대 재시도 횟수 초과
        throw new ApiError(
          'Rate limit exceeded and max retries reached',
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      // 에러 응답 처리
      if (!response.ok) {
        const errorData: GitHubApiError = await response.json();
        throw parseGitHubError(response, errorData);
      }

      // 성공 응답 (데이터와 헤더 모두 반환)
      const data = await response.json();
      return { data, headers: response.headers };
    } catch (error) {
      // ApiError는 그대로 throw
      if (error instanceof ApiError) {
        throw error;
      }

      // 네트워크 에러 등 재시도 가능한 에러
      if (
        retryCount < this.retryConfig.maxRetries &&
        this.isRetryableError(error)
      ) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.warn(
          `[GitHub API] Request failed. Retrying in ${delay}ms...`,
          error
        );
        await this.sleep(delay);
        return this.fetchWithRetry<T>(url, retryCount + 1);
      }

      // 재시도 불가능하거나 최대 재시도 횟수 초과
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Exponential Backoff 딜레이 계산
   */
  private calculateBackoffDelay(
    retryCount: number,
    resetTime?: string | null
  ): number {
    // Rate Limit reset 시간이 있으면 그 시간까지 대기
    if (resetTime) {
      const resetTimestamp = parseInt(resetTime, 10) * 1000;
      const now = Date.now();
      const waitTime = resetTimestamp - now;

      if (waitTime > 0 && waitTime < this.retryConfig.maxDelay) {
        return waitTime;
      }
    }

    // Exponential Backoff: baseDelay * 2^retryCount
    const delay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, retryCount),
      this.retryConfig.maxDelay
    );

    // Jitter 추가 (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.floor(delay + jitter);
  }

  /**
   * 재시도 가능한 에러인지 판단
   */
  private isRetryableError(error: unknown): boolean {
    // 네트워크 에러
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // 타임아웃 에러
    if (error instanceof Error && error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * 지정된 시간만큼 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * API 요청 헤더 생성
   */
  private buildHeaders(): HeadersInit {
    return {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `token ${this.token}`,
      'User-Agent': 'GitHub-User-Search-App',
    };
  }

  /**
   * Rate Limit 헤더 추출 (응답 헤더용)
   */
  static extractRateLimitHeaders(response: Response): {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'X-RateLimit-Used': string;
  } | null {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const used = response.headers.get('X-RateLimit-Used');

    if (limit && remaining && reset) {
      return {
        'X-RateLimit-Limit': limit,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': reset,
        'X-RateLimit-Used': used || '0',
      };
    }

    return null;
  }
}
