/**
 * API Route Handler 테스트
 * - POST /api/search/users 엔드포인트 테스트
 * - 입력 검증 테스트
 * - 에러 핸들링 테스트
 * - Rate Limit 헤더 테스트
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/search/users/route';
import { GitHubApiClient } from '@/lib/github-api-client';

// GitHubApiClient Mock
jest.mock('@/lib/github-api-client');

describe('POST /api/search/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Helper: NextRequest 생성
   */
  function createRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/search/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  describe('정상 요청 처리', () => {
    it('기본 검색 요청 성공', async () => {
      // Given
      const requestBody = {
        query: 'javascript',
      };

      const mockResponse = {
        users: [
          {
            id: 1,
            login: 'test-user',
            name: 'Test User',
            type: 'User',
            avatarUrl: 'https://avatar.url',
            htmlUrl: 'https://github.com/test-user',
            bio: 'Test bio',
            location: 'Seoul',
            company: 'Test Company',
            email: 'test@example.com',
            blog: 'https://test.dev',
            publicRepos: 10,
            publicGists: 5,
            followers: 100,
            following: 50,
            createdAt: '2020-01-01',
            updatedAt: '2023-01-01',
            isSponsored: false,
          },
        ],
        metadata: {
          incompleteResults: false,
          totalCount: 1,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      };

      const mockHeaders = {
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999',
        'x-ratelimit-reset': '1234567890',
        'x-ratelimit-used': '1',
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: mockResponse,
              headers: mockHeaders,
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          'X-RateLimit-Limit': '5000',
          'X-RateLimit-Remaining': '4999',
          'X-RateLimit-Reset': '1234567890',
          'X-RateLimit-Used': '1',
        });

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('모든 필터를 포함한 검색 성공', async () => {
      // Given
      const requestBody = {
        query: 'react developer',
        type: 'user',
        searchIn: ['name', 'email'],
        repos: { min: 10, max: 100 },
        location: 'Seoul',
        language: 'TypeScript',
        created: { from: '2020-01-01', to: '2023-12-31' },
        followers: { min: 50, max: 500 },
        isSponsored: true,
        page: 2,
        perPage: 50,
        sort: 'followers',
        sortOrder: 'desc',
      };

      const mockResponse = {
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 2,
          perPage: 50,
          hasNextPage: false,
        },
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: mockResponse,
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data).toEqual(mockResponse);
    });

    it('Rate Limit 헤더가 응답에 포함됨', async () => {
      // Given
      const requestBody = {
        query: 'test',
      };

      const rateLimitHeaders = {
        'X-RateLimit-Limit': '5000',
        'X-RateLimit-Remaining': '4500',
        'X-RateLimit-Reset': '1234567890',
        'X-RateLimit-Used': '500',
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: { users: [], metadata: {} },
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(rateLimitHeaders);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('5000');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('4500');
    });

    it('빈 결과 응답 처리', async () => {
      // Given
      const requestBody = {
        query: 'nonexistentuser12345',
      };

      const mockResponse = {
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: mockResponse,
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(0);
      expect(data.metadata.totalCount).toBe(0);
    });

    it('페이지네이션 파라미터 전달', async () => {
      // Given
      const requestBody = {
        query: 'python',
        page: 5,
        perPage: 50,
      };

      const mockSearchUsers = jest.fn().mockResolvedValue({
        data: { users: [], metadata: {} },
        headers: {},
      });

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: mockSearchUsers,
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      await POST(request);

      // Then
      expect(mockSearchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 5,
          perPage: 50,
        })
      );
    });
  });

  describe('입력 검증 - 검색어', () => {
    it('검색어가 없으면 400 에러', async () => {
      // Given
      const requestBody = {};

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is required');
    });

    it('검색어가 빈 문자열이면 400 에러', async () => {
      // Given
      const requestBody = {
        query: '',
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is required');
    });

    it('검색어가 공백만 있으면 400 에러', async () => {
      // Given
      const requestBody = {
        query: '   ',
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is required');
    });

    it('검색어가 256자 초과면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'a'.repeat(257),
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Search query is too long');
      expect(data.code).toBe('QUERY_TOO_LONG');
    });

    it('검색어가 정확히 256자면 성공', async () => {
      // Given
      const requestBody = {
        query: 'a'.repeat(256),
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: { users: [], metadata: {} },
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
    });
  });

  describe('입력 검증 - 페이지네이션', () => {
    it('페이지 번호가 0이면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        page: 0,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Page must be a positive integer');
      expect(data.code).toBe('INVALID_PAGE');
    });

    it('페이지 번호가 음수면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        page: -5,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PAGE');
    });

    it('페이지 번호가 너무 크면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        page: 100, // 30개씩 로드 시 최대 33페이지
        perPage: 30,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Page number too high');
      expect(data.code).toBe('PAGE_TOO_HIGH');
    });

    it('perPage가 0이면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        perPage: 0,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('perPage must be between 1 and 100');
      expect(data.code).toBe('INVALID_PER_PAGE');
    });

    it('perPage가 100 초과면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        perPage: 101,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PER_PAGE');
    });

    it('perPage가 소수면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        perPage: 25.5,
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_PER_PAGE');
    });
  });

  describe('입력 검증 - 범위 필터', () => {
    it('repos.min이 음수면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        repos: { min: -1 },
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('repos.min must be a non-negative integer');
      expect(data.code).toBe('INVALID_RANGE');
    });

    it('repos.min이 max보다 크면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        repos: { min: 100, max: 50 },
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'repos.min cannot be greater than repos.max'
      );
    });

    it('followers.min이 소수면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        followers: { min: 10.5 },
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_RANGE');
    });

    it('유효한 범위 필터는 성공', async () => {
      // Given
      const requestBody = {
        query: 'test',
        repos: { min: 10, max: 100 },
        followers: { min: 50, max: 500 },
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: { users: [], metadata: {} },
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
    });
  });

  describe('입력 검증 - 날짜 형식', () => {
    it('잘못된 created.from 형식이면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        created: { from: '2020/01/01' }, // 슬래시 사용
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
      expect(data.code).toBe('INVALID_DATE_FORMAT');
    });

    it('잘못된 created.to 형식이면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        created: { to: '01-01-2020' }, // 잘못된 순서
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_DATE_FORMAT');
    });

    it('존재하지 않는 날짜면 400 에러', async () => {
      // Given
      const requestBody = {
        query: 'test',
        created: { from: '2020-02-30' }, // 2월 30일은 없음
      };

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(400);
    });

    it('올바른 날짜 형식은 성공', async () => {
      // Given
      const requestBody = {
        query: 'test',
        created: { from: '2020-01-01', to: '2023-12-31' },
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockResolvedValue({
              data: { users: [], metadata: {} },
              headers: {},
            }),
          }) as any
      );

      (GitHubApiClient.extractRateLimitHeaders as jest.Mock) = jest
        .fn()
        .mockReturnValue(null);

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(200);
    });
  });

  describe('에러 처리', () => {
    it('GitHub API 에러는 500으로 반환', async () => {
      // Given
      const requestBody = {
        query: 'test',
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest
              .fn()
              .mockRejectedValue(new Error('GitHub API error')),
          }) as any
      );

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);
      const data = await response.json();

      // Then
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('Rate Limit 초과 에러 처리', async () => {
      // Given
      const requestBody = {
        query: 'test',
      };

      const rateLimitError = new Error('API rate limit exceeded');
      (rateLimitError as any).status = 403;

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest.fn().mockRejectedValue(rateLimitError),
          }) as any
      );

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
    });

    it('네트워크 에러 처리', async () => {
      // Given
      const requestBody = {
        query: 'test',
      };

      (
        GitHubApiClient as jest.MockedClass<typeof GitHubApiClient>
      ).mockImplementation(
        () =>
          ({
            searchUsers: jest
              .fn()
              .mockRejectedValue(new Error('Network error')),
          }) as any
      );

      const request = createRequest(requestBody);

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(500);
    });

    it('잘못된 JSON 형식 에러 처리', async () => {
      // Given
      const request = new NextRequest(
        'http://localhost:3000/api/search/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: '{invalid json',
        }
      );

      // When
      const response = await POST(request);

      // Then
      expect(response.status).toBe(400);
    });
  });
});

describe('GET /api/search/users', () => {
  it('GET 요청은 405 에러 반환', async () => {
    // When
    const response = await GET();
    const data = await response.json();

    // Then
    expect(response.status).toBe(405);
    expect(data.error).toContain('Method not allowed');
  });
});
