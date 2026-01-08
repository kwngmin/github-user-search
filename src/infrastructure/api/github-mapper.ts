/**
 * GitHub API 응답을 Domain Entity로 변환하는 매퍼
 * - Infrastructure → Domain 경계에서 데이터 변환
 * - API 구조 변경에 대한 격리
 */

import {
  GitHubUser,
  SearchResult,
  SearchMetadata,
  RateLimit,
} from '@/domain/entities/user';
import {
  GitHubApiUser,
  GitHubSearchResponse,
  GitHubRateLimitResponse,
} from './github-types';

export class GitHubApiMapper {
  /**
   * API 사용자 객체를 Domain 엔티티로 변환
   */
  static toDomainUser(apiUser: GitHubApiUser): GitHubUser {
    return {
      id: apiUser.id,
      login: apiUser.login,
      avatarUrl: apiUser.avatar_url,
      htmlUrl: apiUser.html_url,
      type: apiUser.type,
      name: apiUser.name,
      company: apiUser.company,
      blog: apiUser.blog,
      location: apiUser.location,
      email: apiUser.email,
      bio: apiUser.bio,
      publicRepos: apiUser.public_repos,
      publicGists: apiUser.public_gists,
      followers: apiUser.followers,
      following: apiUser.following,
      createdAt: apiUser.created_at,
      updatedAt: apiUser.updated_at,
    };
  }

  /**
   * API 검색 응답을 Domain SearchResult로 변환
   */
  static toSearchResult(
    apiResponse: GitHubSearchResponse,
    currentPage: number,
    perPage: number
  ): SearchResult {
    const users = apiResponse.items.map(item => this.toDomainUser(item));

    const metadata: SearchMetadata = {
      totalCount: apiResponse.total_count,
      incompleteResults: apiResponse.incomplete_results,
      currentPage,
      perPage,
      hasNextPage: currentPage * perPage < apiResponse.total_count,
    };

    return {
      users,
      metadata,
    };
  }

  /**
   * API Rate Limit 응답을 Domain RateLimit으로 변환
   */
  static toRateLimit(apiResponse: GitHubRateLimitResponse): RateLimit {
    // 검색 API의 Rate Limit 사용
    const searchLimit = apiResponse.resources.search;

    return {
      limit: searchLimit.limit,
      remaining: searchLimit.remaining,
      reset: searchLimit.reset,
      used: searchLimit.used,
    };
  }
}
