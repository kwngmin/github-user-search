/**
 * 사용자 리포지토리 인터페이스
 * - Domain Layer에서 정의하는 추상 인터페이스
 * - Infrastructure Layer에서 구현
 * - Dependency Inversion Principle 적용
 */

import { SearchFilters } from '../types/filters';
import { SearchResult, RateLimit } from '../entities/user';

export interface UserRepository {
  /**
   * 사용자 검색
   * @param filters - 검색 필터
   * @returns 검색 결과 및 메타데이터
   */
  searchUsers(filters: SearchFilters): Promise<SearchResult>;

  /**
   * Rate Limit 정보 조회
   * @returns 현재 Rate Limit 상태
   */
  getRateLimit(): Promise<RateLimit>;
}
