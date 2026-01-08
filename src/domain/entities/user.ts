/**
 * GitHub 사용자 엔티티
 * - 비즈니스 도메인의 핵심 데이터 모델
 * - API 응답과 독립적인 순수한 비즈니스 객체
 */

export interface GitHubUser {
  id: number;
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  type: 'User' | 'Organization';
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  isSponsored?: boolean;
}

/**
 * 검색 결과 메타데이터
 */
export interface SearchMetadata {
  totalCount: number;
  incompleteResults: boolean;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
}

/**
 * 검색 결과 래퍼
 */
export interface SearchResult {
  users: GitHubUser[];
  metadata: SearchMetadata;
}

/**
 * Rate Limit 정보
 */
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}
