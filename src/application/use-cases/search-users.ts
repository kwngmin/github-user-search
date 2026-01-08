/**
 * GitHub 사용자 검색 유즈케이스
 * - 비즈니스 로직을 담당하는 레이어
 * - Domain과 Infrastructure 사이의 중재자
 */

import { UserRepository } from '@/domain/repositories/user-repository.interface';
import { SearchFilters } from '@/domain/types/filters';
import { SearchResult } from '@/domain/entities/user';

export class SearchUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 사용자 검색 실행
   * @param filters - 검색 필터 객체
   * @returns 검색 결과 및 메타데이터
   * @throws Error - API 호출 실패 시
   */
  async execute(filters: SearchFilters): Promise<SearchResult> {
    // 1. 입력 검증
    this.validateFilters(filters);

    // 2. 기본값 설정
    const normalizedFilters = this.normalizeFilters(filters);

    // 3. 리포지토리를 통한 검색 실행
    try {
      const result = await this.userRepository.searchUsers(normalizedFilters);
      return result;
    } catch (error) {
      // 에러 처리 및 재포장
      if (error instanceof Error) {
        throw new Error(`User search failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 필터 유효성 검증
   */
  private validateFilters(filters: SearchFilters): void {
    // 검색어가 비어있으면 안됨
    if (!filters.query || filters.query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // 검색어 길이 제한 (256자)
    if (filters.query.length > 256) {
      throw new Error('Search query is too long (max 256 characters)');
    }

    // 페이지 번호 검증
    if (filters.page !== undefined && filters.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    // perPage 검증 (GitHub API 제한: 1-100)
    if (filters.perPage !== undefined) {
      if (filters.perPage < 1 || filters.perPage > 100) {
        throw new Error('Per page must be between 1 and 100');
      }
    }

    // 범위 필터 검증
    if (filters.repos) {
      this.validateRangeFilter(filters.repos, 'repos');
    }

    if (filters.followers) {
      this.validateRangeFilter(filters.followers, 'followers');
    }
  }

  /**
   * 범위 필터 유효성 검증
   */
  private validateRangeFilter(
    range: { min?: number; max?: number; exact?: number },
    fieldName: string
  ): void {
    if (range.min !== undefined && range.min < 0) {
      throw new Error(`${fieldName} min must be non-negative`);
    }

    if (range.max !== undefined && range.max < 0) {
      throw new Error(`${fieldName} max must be non-negative`);
    }

    if (
      range.min !== undefined &&
      range.max !== undefined &&
      range.min > range.max
    ) {
      throw new Error(`${fieldName} min cannot be greater than max`);
    }

    if (range.exact !== undefined && range.exact < 0) {
      throw new Error(`${fieldName} exact must be non-negative`);
    }
  }

  /**
   * 필터 정규화 (기본값 설정)
   */
  private normalizeFilters(filters: SearchFilters): SearchFilters {
    return {
      ...filters,
      query: filters.query.trim(),
      page: filters.page ?? 1,
      perPage: filters.perPage ?? 30,
      sort: filters.sort ?? 'best-match',
      sortOrder: filters.sortOrder ?? 'desc',
    };
  }
}

/**
 * Rate Limit 조회 유즈케이스
 */
export class GetRateLimitUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Rate Limit 정보 조회
   * @returns Rate Limit 상태
   */
  async execute() {
    return await this.userRepository.getRateLimit();
  }
}
