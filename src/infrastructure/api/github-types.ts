/**
 * GitHub API 응답 타입
 * - 실제 GitHub REST API 응답 구조
 * - Infrastructure Layer에서만 사용
 */

/**
 * GitHub API 사용자 응답
 */
export interface GitHubApiUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
  type: 'User' | 'Organization';
  name: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  node_id: string;
  gravatar_id: string | null;
  url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  site_admin: boolean;
  hireable: boolean | null;
  twitter_username: string | null;
}

/**
 * GitHub API 검색 응답
 */
export interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubApiUser[];
}

/**
 * GitHub API Rate Limit 응답
 */
export interface GitHubRateLimitResponse {
  resources: {
    core: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
    search: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
    graphql: {
      limit: number;
      remaining: number;
      reset: number;
      used: number;
    };
  };
  rate: {
    limit: number;
    remaining: number;
    reset: number;
    used: number;
  };
}

/**
 * GitHub API 에러 응답
 */
export interface GitHubApiError {
  message: string;
  documentation_url: string;
  status?: number;
}
