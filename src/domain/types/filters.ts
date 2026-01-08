/**
 * GitHub 사용자 검색 필터
 * - 8가지 검색 기능을 위한 타입 정의
 */

/**
 * 사용자 타입 필터
 * 1. 사용자 또는 조직만 검색
 */
export type UserType = 'user' | 'org';

/**
 * 검색 대상 필드
 * 2. 계정 이름, 성명 또는 메일로 검색
 */
export type SearchInField = 'login' | 'name' | 'email';

/**
 * 범위 필터 (리포지토리 수, 팔로워 수)
 * 3. 사용자가 소유한 리포지토리 수로 검색
 * 7. 팔로워 수로 검색
 */
export interface RangeFilter {
  min?: number;
  max?: number;
  exact?: number;
}

/**
 * 날짜 범위 필터
 * 6. 개인 계정을 만든 시점별 검색
 */
export interface DateRangeFilter {
  from?: string; // ISO 8601 format (YYYY-MM-DD)
  to?: string;
  exact?: string;
}

/**
 * 정렬 옵션
 */
export type SortOption = 'best-match' | 'followers' | 'repositories' | 'joined';
export type SortOrder = 'asc' | 'desc';

/**
 * 검색 필터 전체 인터페이스
 */
export interface SearchFilters {
  // 기본 검색어
  query: string;

  // 1. 사용자 또는 조직만 검색
  type?: UserType;

  // 2. 계정 이름, 성명 또는 메일로 검색
  searchIn?: SearchInField[];

  // 3. 사용자가 소유한 리포지토리 수로 검색
  repos?: RangeFilter;

  // 4. 위치별 검색
  location?: string;

  // 5. 사용 언어로 검색
  language?: string;

  // 6. 개인 계정을 만든 시점별 검색
  created?: DateRangeFilter;

  // 7. 팔로워 수로 검색
  followers?: RangeFilter;

  // 8. 후원 가능 여부를 기준으로 검색
  isSponsored?: boolean;

  // 정렬 옵션
  sort?: SortOption;
  sortOrder?: SortOrder;

  // 페이징
  page?: number;
  perPage?: number;
}

/**
 * 검색 쿼리 문자열 빌더 결과
 */
export interface SearchQuery {
  q: string; // GitHub API 쿼리 문자열
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}
