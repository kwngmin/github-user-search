/**
 * GitHub Search API 쿼리 빌더
 * - 8가지 검색 필터를 GitHub API 쿼리 문자열로 변환
 * - Application Layer의 유틸리티
 *
 * @example
 * ```typescript
 * const query = SearchQueryBuilder.build({
 *   query: 'react',
 *   type: 'user',
 *   location: 'Seoul',
 *   repos: { min: 100 },
 *   followers: { min: 100 },
 * });
 * // 결과: "react type:user location:Seoul repos:>=100 followers:>=100"
 * ```
 */

import {
  SearchFilters,
  SearchQuery,
  RangeFilter,
  DateRangeFilter,
} from '@/domain/types/filters';

export class SearchQueryBuilder {
  /**
   * SearchFilters를 GitHub API 쿼리로 변환
   * @param filters - 검색 필터 객체
   * @returns GitHub API 요청 파라미터
   *
   * @example
   * ```typescript
   * SearchQueryBuilder.build({
   *   query: 'javascript developer',
   *   type: 'user',
   *   searchIn: ['name', 'email'],
   *   repos: { min: 10, max: 100 },
   *   location: 'Seoul',
   *   language: 'TypeScript',
   *   created: { from: '2020-01-01' },
   *   followers: { min: 100 },
   *   isSponsored: true,
   *   sort: 'followers',
   *   sortOrder: 'desc',
   * });
   * // 반환: {
   * //   q: 'javascript developer type:user in:name in:email repos:10..100 location:Seoul language:TypeScript created:>=2020-01-01 followers:>=100 is:sponsorable',
   * //   sort: 'followers',
   * //   order: 'desc',
   * //   page: 1,
   * //   per_page: 30
   * // }
   * ```
   */
  static build(filters: SearchFilters): SearchQuery {
    const queryParts: string[] = [];

    // 기본 검색어
    if (filters.query) {
      queryParts.push(filters.query);
    }

    // 1. 사용자 또는 조직만 검색 (type:user | type:org)
    if (filters.type) {
      queryParts.push(`type:${filters.type}`);
    }

    // 2. 계정 이름, 성명 또는 메일로 검색 (in:login | in:name | in:email)
    if (filters.searchIn && filters.searchIn.length > 0) {
      const inClause = filters.searchIn.map(field => `in:${field}`).join(' ');
      queryParts.push(inClause);
    }

    // 3. 사용자가 소유한 리포지토리 수로 검색 (repos:>100 | repos:10..50)
    if (filters.repos) {
      const reposQuery = this.buildRangeQuery('repos', filters.repos);
      if (reposQuery) queryParts.push(reposQuery);
    }

    // 4. 위치별 검색 (location:Seoul)
    if (filters.location) {
      queryParts.push(`location:${this.escapeQuery(filters.location)}`);
    }

    // 5. 사용 언어로 검색 (language:TypeScript)
    if (filters.language) {
      queryParts.push(`language:${this.escapeQuery(filters.language)}`);
    }

    // 6. 개인 계정을 만든 시점별 검색 (created:>2020-01-01)
    if (filters.created) {
      const createdQuery = this.buildDateRangeQuery('created', filters.created);
      if (createdQuery) queryParts.push(createdQuery);
    }

    // 7. 팔로워 수로 검색 (followers:>100 | followers:50..200)
    if (filters.followers) {
      const followersQuery = this.buildRangeQuery(
        'followers',
        filters.followers
      );
      if (followersQuery) queryParts.push(followersQuery);
    }

    // 8. 후원 가능 여부를 기준으로 검색 (is:sponsorable)
    if (filters.isSponsored !== undefined && filters.isSponsored) {
      queryParts.push('is:sponsorable');
    }

    return {
      q: queryParts.join(' '),
      sort: filters.sort !== 'best-match' ? filters.sort : undefined,
      order: filters.sortOrder,
      page: filters.page,
      per_page: filters.perPage,
    };
  }

  /**
   * 범위 필터를 쿼리 문자열로 변환
   *
   * @param field - 필드명 (repos, followers 등)
   * @param range - 범위 필터 객체
   * @returns 쿼리 문자열 또는 null
   *
   * @example
   * ```typescript
   * buildRangeQuery('repos', { min: 10 })          // "repos:>=10"
   * buildRangeQuery('repos', { max: 100 })         // "repos:<=100"
   * buildRangeQuery('repos', { min: 10, max: 50 }) // "repos:10..50"
   * buildRangeQuery('repos', { exact: 42 })        // "repos:42"
   * ```
   */
  private static buildRangeQuery(
    field: string,
    range: RangeFilter
  ): string | null {
    // 정확한 값 (exact: 42 → repos:42)
    if (range.exact !== undefined) {
      return `${field}:${range.exact}`;
    }

    // 범위 (min: 10, max: 50 → repos:10..50)
    if (range.min !== undefined && range.max !== undefined) {
      return `${field}:${range.min}..${range.max}`;
    }

    // 최소값 이상 (min: 10 → repos:>=10)
    if (range.min !== undefined) {
      return `${field}:>=${range.min}`;
    }

    // 최대값 이하 (max: 100 → repos:<=100)
    if (range.max !== undefined) {
      return `${field}:<=${range.max}`;
    }

    return null;
  }

  /**
   * 날짜 범위 필터를 쿼리 문자열로 변환
   *
   * @param field - 필드명 (created 등)
   * @param range - 날짜 범위 필터 객체
   * @returns 쿼리 문자열 또는 null
   *
   * @example
   * ```typescript
   * buildDateRangeQuery('created', { from: '2020-01-01' })                          // "created:>=2020-01-01"
   * buildDateRangeQuery('created', { to: '2023-12-31' })                            // "created:<=2023-12-31"
   * buildDateRangeQuery('created', { from: '2020-01-01', to: '2023-12-31' })        // "created:2020-01-01..2023-12-31"
   * buildDateRangeQuery('created', { exact: '2022-06-15' })                         // "created:2022-06-15"
   * ```
   */
  private static buildDateRangeQuery(
    field: string,
    range: DateRangeFilter
  ): string | null {
    // 정확한 날짜 (exact: '2022-01-01' → created:2022-01-01)
    if (range.exact) {
      return `${field}:${range.exact}`;
    }

    // 날짜 범위 (from: '2020-01-01', to: '2023-12-31' → created:2020-01-01..2023-12-31)
    if (range.from && range.to) {
      return `${field}:${range.from}..${range.to}`;
    }

    // 시작일 이후 (from: '2020-01-01' → created:>=2020-01-01)
    if (range.from) {
      return `${field}:>=${range.from}`;
    }

    // 종료일 이전 (to: '2023-12-31' → created:<=2023-12-31)
    if (range.to) {
      return `${field}:<=${range.to}`;
    }

    return null;
  }

  /**
   * 검색어 이스케이프 처리
   * - 공백이 포함된 경우 큰따옴표로 감싸기
   *
   * @param query - 이스케이프할 문자열
   * @returns 이스케이프된 문자열
   *
   * @example
   * ```typescript
   * escapeQuery('Seoul')           // "Seoul"
   * escapeQuery('San Francisco')   // '"San Francisco"'
   * escapeQuery('New York City')   // '"New York City"'
   * ```
   */
  private static escapeQuery(query: string): string {
    if (query.includes(' ')) {
      return `"${query}"`;
    }
    return query;
  }
}
