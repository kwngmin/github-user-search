/**
 * SearchUsersUseCase 테스트
 * - 검색 로직 테스트
 * - 입력 검증 테스트
 * - 에러 처리 테스트
 */

import {
  SearchUsersUseCase,
  GetRateLimitUseCase,
} from '@/application/use-cases/search-users';
import { UserRepository } from '@/domain/repositories/user-repository.interface';
import { SearchFilters } from '@/domain/types/filters';
import { SearchResult, RateLimit } from '@/domain/entities/user';

// Mock Repository
class MockUserRepository implements UserRepository {
  searchUsers = jest.fn();
  getRateLimit = jest.fn();
}

describe('SearchUsersUseCase', () => {
  let useCase: SearchUsersUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new SearchUsersUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('정상 검색 실행', () => {
    it('기본 검색어로 검색 성공', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'javascript',
      };

      const expectedResult: SearchResult = {
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

      mockRepository.searchUsers.mockResolvedValue(expectedResult);

      // When
      const result = await useCase.execute(filters);

      // Then
      expect(result).toEqual(expectedResult);
      expect(mockRepository.searchUsers).toHaveBeenCalledWith({
        query: 'javascript',
        page: 1,
        perPage: 30,
        sort: 'best-match',
        sortOrder: 'desc',
      });
    });

    it('모든 필터를 포함한 검색 성공', async () => {
      // Given
      const filters: SearchFilters = {
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

      const expectedResult: SearchResult = {
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 2,
          perPage: 50,
          hasNextPage: false,
        },
      };

      mockRepository.searchUsers.mockResolvedValue(expectedResult);

      // When
      const result = await useCase.execute(filters);

      // Then
      expect(result).toEqual(expectedResult);
      expect(mockRepository.searchUsers).toHaveBeenCalledWith(filters);
    });

    it('검색어 앞뒤 공백 제거 (trim)', async () => {
      // Given
      const filters: SearchFilters = {
        query: '  typescript  ',
      };

      mockRepository.searchUsers.mockResolvedValue({
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      });

      // When
      await useCase.execute(filters);

      // Then
      expect(mockRepository.searchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'typescript', // 공백 제거됨
        })
      );
    });

    it('기본값 설정 확인', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'developer',
      };

      mockRepository.searchUsers.mockResolvedValue({
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      });

      // When
      await useCase.execute(filters);

      // Then
      expect(mockRepository.searchUsers).toHaveBeenCalledWith({
        query: 'developer',
        page: 1, // 기본값
        perPage: 30, // 기본값
        sort: 'best-match', // 기본값
        sortOrder: 'desc', // 기본값
      });
    });

    it('페이지네이션 파라미터 전달', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'nodejs',
        page: 3,
        perPage: 50,
      };

      mockRepository.searchUsers.mockResolvedValue({
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 3,
          perPage: 50,
          hasNextPage: false,
        },
      });

      // When
      await useCase.execute(filters);

      // Then
      expect(mockRepository.searchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          perPage: 50,
        })
      );
    });
  });

  describe('입력 검증 - 검색어', () => {
    it('검색어가 빈 문자열이면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: '',
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Search query cannot be empty'
      );
      expect(mockRepository.searchUsers).not.toHaveBeenCalled();
    });

    it('검색어가 공백만 있으면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: '   ',
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Search query cannot be empty'
      );
    });

    it('검색어가 너무 길면 에러 (256자 초과)', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'a'.repeat(257),
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Search query is too long (max 256 characters)'
      );
    });

    it('검색어가 정확히 256자면 성공', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'a'.repeat(256),
      };

      mockRepository.searchUsers.mockResolvedValue({
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      });

      // When & Then
      await expect(useCase.execute(filters)).resolves.toBeDefined();
    });
  });

  describe('입력 검증 - 페이지네이션', () => {
    it('페이지 번호가 0이면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        page: 0,
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Page number must be greater than 0'
      );
    });

    it('페이지 번호가 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        page: -1,
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Page number must be greater than 0'
      );
    });

    it('perPage가 0이면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        perPage: 0,
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Per page must be between 1 and 100'
      );
    });

    it('perPage가 100 초과면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        perPage: 101,
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Per page must be between 1 and 100'
      );
    });

    it('perPage가 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        perPage: -5,
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'Per page must be between 1 and 100'
      );
    });
  });

  describe('입력 검증 - 범위 필터', () => {
    it('repos.min이 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        repos: { min: -1 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'repos min must be non-negative'
      );
    });

    it('repos.max가 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        repos: { max: -10 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'repos max must be non-negative'
      );
    });

    it('repos.min이 max보다 크면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        repos: { min: 100, max: 50 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'repos min cannot be greater than max'
      );
    });

    it('repos.exact가 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        repos: { exact: -5 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'repos exact must be non-negative'
      );
    });

    it('followers.min이 음수면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        followers: { min: -1 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'followers min must be non-negative'
      );
    });

    it('followers.min이 max보다 크면 에러', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        followers: { min: 1000, max: 100 },
      };

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'followers min cannot be greater than max'
      );
    });

    it('유효한 범위 필터는 성공', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
        repos: { min: 10, max: 100 },
        followers: { min: 50, max: 500 },
      };

      mockRepository.searchUsers.mockResolvedValue({
        users: [],
        metadata: {
          incompleteResults: false,
          totalCount: 0,
          currentPage: 1,
          perPage: 30,
          hasNextPage: false,
        },
      });

      // When & Then
      await expect(useCase.execute(filters)).resolves.toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('리포지토리에서 에러 발생 시 재포장', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
      };

      const originalError = new Error('Network error');
      mockRepository.searchUsers.mockRejectedValue(originalError);

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'User search failed: Network error'
      );
    });

    it('알 수 없는 에러는 그대로 전파', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
      };

      const unknownError = 'Some string error';
      mockRepository.searchUsers.mockRejectedValue(unknownError);

      // When & Then
      await expect(useCase.execute(filters)).rejects.toBe(unknownError);
    });

    it('API Rate Limit 에러 처리', async () => {
      // Given
      const filters: SearchFilters = {
        query: 'test',
      };

      const rateLimitError = new Error('API rate limit exceeded');
      mockRepository.searchUsers.mockRejectedValue(rateLimitError);

      // When & Then
      await expect(useCase.execute(filters)).rejects.toThrow(
        'User search failed: API rate limit exceeded'
      );
    });
  });
});

describe('GetRateLimitUseCase', () => {
  let useCase: GetRateLimitUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new GetRateLimitUseCase(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limit 조회', () => {
    it('Rate Limit 정보 조회 성공', async () => {
      // Given
      const expectedRateLimit: RateLimit = {
        limit: 5000,
        remaining: 4999,
        reset: 1234567890,
        used: 1,
      };

      mockRepository.getRateLimit.mockResolvedValue(expectedRateLimit);

      // When
      const result = await useCase.execute();

      // Then
      expect(result).toEqual(expectedRateLimit);
      expect(mockRepository.getRateLimit).toHaveBeenCalledTimes(1);
    });

    it('Rate Limit 조회 실패 시 에러 전파', async () => {
      // Given
      const error = new Error('Failed to fetch rate limit');
      mockRepository.getRateLimit.mockRejectedValue(error);

      // When & Then
      await expect(useCase.execute()).rejects.toThrow(
        'Failed to fetch rate limit'
      );
    });

    it('Rate Limit이 낮을 때 경고 데이터 확인', async () => {
      // Given
      const lowRateLimit: RateLimit = {
        limit: 5000,
        remaining: 10,
        reset: 1234567890,
        used: 4990,
      };

      mockRepository.getRateLimit.mockResolvedValue(lowRateLimit);

      // When
      const result = await useCase.execute();

      // Then
      expect(result.remaining).toBeLessThan(100);
      expect(result.used).toBeGreaterThan(4900);
    });

    it('Rate Limit이 초과되었을 때 데이터 확인', async () => {
      // Given
      const exceededRateLimit: RateLimit = {
        limit: 5000,
        remaining: 0,
        reset: Date.now() + 3600000, // 1시간 후
        used: 5000,
      };

      mockRepository.getRateLimit.mockResolvedValue(exceededRateLimit);

      // When
      const result = await useCase.execute();

      // Then
      expect(result.remaining).toBe(0);
      expect(result.used).toBe(result.limit);
    });

    it('Rate Limit reset 시간 형식 확인', async () => {
      // Given
      const resetTime = Math.floor(Date.now() / 1000) + 3600; // Unix timestamp
      const rateLimit: RateLimit = {
        limit: 5000,
        remaining: 4500,
        reset: resetTime,
        used: 500,
      };

      mockRepository.getRateLimit.mockResolvedValue(rateLimit);

      // When
      const result = await useCase.execute();

      // Then
      expect(result.reset).toBe(resetTime);
      expect(typeof result.reset).toBe('number');
    });
  });
});
