/**
 * GitHub Search API 쿼리 빌더
 * - 8가지 검색 필터를 GitHub API 쿼리 문자열로 변환
 * - Application Layer의 유틸리티
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
   */
  static build(filters: SearchFilters): SearchQuery {
    const queryParts: string[] = [];

    // 기본 검색어
    if (filters.query) {
      queryParts.push(filters.query);
    }

    // 1. 사용자 또는 조직만 검색
    if (filters.type) {
      queryParts.push(`type:${filters.type}`);
    }

    // 2. 계정 이름, 성명 또는 메일로 검색
    if (filters.searchIn && filters.searchIn.length > 0) {
      const inClause = filters.searchIn.map(field => `in:${field}`).join(' ');
      queryParts.push(inClause);
    }

    // 3. 사용자가 소유한 리포지토리 수로 검색
    if (filters.repos) {
      const reposQuery = this.buildRangeQuery('repos', filters.repos);
      if (reposQuery) queryParts.push(reposQuery);
    }

    // 4. 위치별 검색
    if (filters.location) {
      queryParts.push(`location:${this.escapeQuery(filters.location)}`);
    }

    // 5. 사용 언어로 검색
    if (filters.language) {
      queryParts.push(`language:${this.escapeQuery(filters.language)}`);
    }

    // 6. 개인 계정을 만든 시점별 검색
    if (filters.created) {
      const createdQuery = this.buildDateRangeQuery('created', filters.created);
      if (createdQuery) queryParts.push(createdQuery);
    }

    // 7. 팔로워 수로 검색
    if (filters.followers) {
      const followersQuery = this.buildRangeQuery(
        'followers',
        filters.followers
      );
      if (followersQuery) queryParts.push(followersQuery);
    }

    // 8. 후원 가능 여부를 기준으로 검색
    if (filters.isSponsored !== undefined) {
      queryParts.push(`is:sponsorable`);
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
   * @example repos:>10, repos:10..50, repos:10
   */
  private static buildRangeQuery(
    field: string,
    range: RangeFilter
  ): string | null {
    if (range.exact !== undefined) {
      return `${field}:${range.exact}`;
    }

    if (range.min !== undefined && range.max !== undefined) {
      return `${field}:${range.min}..${range.max}`;
    }

    if (range.min !== undefined) {
      return `${field}:>=${range.min}`;
    }

    if (range.max !== undefined) {
      return `${field}:<=${range.max}`;
    }

    return null;
  }

  /**
   * 날짜 범위 필터를 쿼리 문자열로 변환
   * @example created:>2020-01-01, created:2020..2023
   */
  private static buildDateRangeQuery(
    field: string,
    range: DateRangeFilter
  ): string | null {
    if (range.exact) {
      return `${field}:${range.exact}`;
    }

    if (range.from && range.to) {
      return `${field}:${range.from}..${range.to}`;
    }

    if (range.from) {
      return `${field}:>=${range.from}`;
    }

    if (range.to) {
      return `${field}:<=${range.to}`;
    }

    return null;
  }

  /**
   * 검색어 이스케이프 처리
   * - 공백이 포함된 경우 큰따옴표로 감싸기
   */
  private static escapeQuery(query: string): string {
    if (query.includes(' ')) {
      return `"${query}"`;
    }
    return query;
  }
}
