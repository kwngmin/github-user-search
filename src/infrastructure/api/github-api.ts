/**
 * GitHub API Repository 구현체
 * - UserRepository 인터페이스의 실제 구현
 * - GitHub REST API 호출 처리
 * - Rate Limit 및 에러 핸들링
 */

import { UserRepository } from '@/domain/repositories/user-repository.interface';
import { SearchFilters } from '@/domain/types/filters';
import { SearchResult, RateLimit } from '@/domain/entities/user';
import { SearchQueryBuilder } from '@/application/use-cases/query-builder';
import { GitHubApiMapper } from './github-mapper';
import {
  GitHubSearchResponse,
  GitHubRateLimitResponse,
  GitHubApiError,
} from './github-types';

/**
 * Exponential Backoff 설정
 */
interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
}

export class GitHubApiRepository implements UserRepository {
  private readonly baseUrl = 'https://api.github.com';
  private readonly retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
  };

  constructor(private readonly apiToken?: string) {}

  /**
   * 사용자 검색 실행
   */
  async searchUsers(filters: SearchFilters): Promise<SearchResult> {
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

    // Retry 로직과 함께 API 호출
    const response = await this.fetchWithRetry<GitHubSearchResponse>(url);

    // Domain 엔티티로 변환
    return GitHubApiMapper.toSearchResult(
      response,
      query.page || 1,
      query.per_page || 30
    );
  }

  /**
   * Rate Limit 정보 조회
   */
  async getRateLimit(): Promise<RateLimit> {
    const url = `${this.baseUrl}/rate_limit`;
    const response = await this.fetchWithRetry<GitHubRateLimitResponse>(url);
    return GitHubApiMapper.toRateLimit(response);
  }

  /**
   * Exponential Backoff를 적용한 재시도 로직
   */
  private async fetchWithRetry<T>(url: string, retryCount = 0): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
      });

      // Rate Limit 체크
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');

      // Rate Limit 초과 시 (403 Forbidden)
      if (response.status === 403 && rateLimitRemaining === '0') {
        if (retryCount < this.retryConfig.maxRetries) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          const delay = this.calculateBackoffDelay(retryCount, resetTime);

          console.warn(`Rate limit exceeded. Retrying in ${delay}ms...`);
          await this.sleep(delay);

          return this.fetchWithRetry<T>(url, retryCount + 1);
        }
        throw new Error('Rate limit exceeded and max retries reached');
      }

      // 일반 에러 처리
      if (!response.ok) {
        const error: GitHubApiError = await response.json();
        throw new Error(
          `GitHub API Error: ${error.message} (Status: ${response.status})`
        );
      }

      return await response.json();
    } catch (error) {
      // 네트워크 에러 등의 경우 재시도
      if (
        retryCount < this.retryConfig.maxRetries &&
        this.isRetryableError(error)
      ) {
        const delay = this.calculateBackoffDelay(retryCount);
        console.warn(`Request failed. Retrying in ${delay}ms...`, error);
        await this.sleep(delay);
        return this.fetchWithRetry<T>(url, retryCount + 1);
      }

      throw error;
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
      const resetTimestamp = parseInt(resetTime, 10) * 1000; // Unix timestamp to ms
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true; // 네트워크 에러
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
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    // GitHub Token이 있으면 추가
    if (this.apiToken) {
      headers['Authorization'] = `token ${this.apiToken}`;
    }

    return headers;
  }
}
