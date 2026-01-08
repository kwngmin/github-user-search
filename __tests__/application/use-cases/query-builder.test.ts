/**
 * SearchQueryBuilder 테스트
 * - 8가지 검색 조건을 GitHub API 쿼리로 변환하는 로직 테스트
 */

import { SearchQueryBuilder } from '@/application/use-cases/query-builder';
import { SearchFilters } from '@/domain/types/filters';

describe('SearchQueryBuilder', () => {
  describe('기본 검색어', () => {
    it('검색어만 있을 때', () => {
      const filters: SearchFilters = {
        query: 'javascript',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('javascript');
    });

    it('검색어가 없을 때', () => {
      const filters: SearchFilters = {
        query: '',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('');
    });
  });

  describe('1. 사용자/조직 필터 (type)', () => {
    it('사용자만 검색', () => {
      const filters: SearchFilters = {
        query: 'developer',
        type: 'user',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer type:user');
    });

    it('조직만 검색', () => {
      const filters: SearchFilters = {
        query: 'react',
        type: 'org',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('react type:org');
    });
  });

  describe('2. 검색 대상 필드 (searchIn)', () => {
    it('이름으로만 검색', () => {
      const filters: SearchFilters = {
        query: 'John',
        searchIn: ['name'],
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('John in:name');
    });

    it('이메일로만 검색', () => {
      const filters: SearchFilters = {
        query: 'john',
        searchIn: ['email'],
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('john in:email');
    });

    it('이름과 이메일에서 검색', () => {
      const filters: SearchFilters = {
        query: 'john',
        searchIn: ['name', 'email'],
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('john in:name in:email');
    });

    it('로그인, 이름, 이메일 모두에서 검색', () => {
      const filters: SearchFilters = {
        query: 'smith',
        searchIn: ['login', 'name', 'email'],
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('smith in:login in:name in:email');
    });
  });

  describe('3. 리포지토리 수 필터 (repos)', () => {
    it('최소값 이상', () => {
      const filters: SearchFilters = {
        query: 'developer',
        repos: { min: 100 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer repos:>=100');
    });

    it('최대값 이하', () => {
      const filters: SearchFilters = {
        query: 'developer',
        repos: { max: 50 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer repos:<=50');
    });

    it('범위 (min-max)', () => {
      const filters: SearchFilters = {
        query: 'developer',
        repos: { min: 10, max: 50 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer repos:10..50');
    });

    it('정확한 값', () => {
      const filters: SearchFilters = {
        query: 'developer',
        repos: { exact: 42 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer repos:42');
    });
  });

  describe('4. 위치 필터 (location)', () => {
    it('단일 단어 위치', () => {
      const filters: SearchFilters = {
        query: 'developer',
        location: 'Seoul',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer location:Seoul');
    });

    it('공백 포함 위치 (이스케이프)', () => {
      const filters: SearchFilters = {
        query: 'developer',
        location: 'San Francisco',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer location:"San Francisco"');
    });

    it('여러 단어 위치', () => {
      const filters: SearchFilters = {
        query: 'developer',
        location: 'New York City',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer location:"New York City"');
    });
  });

  describe('5. 언어 필터 (language)', () => {
    it('TypeScript', () => {
      const filters: SearchFilters = {
        query: 'developer',
        language: 'TypeScript',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer language:TypeScript');
    });

    it('JavaScript', () => {
      const filters: SearchFilters = {
        query: 'developer',
        language: 'JavaScript',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer language:JavaScript');
    });

    it('공백 포함 언어 (이스케이프)', () => {
      const filters: SearchFilters = {
        query: 'developer',
        language: 'C Sharp',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer language:"C Sharp"');
    });
  });

  describe('6. 가입일 필터 (created)', () => {
    it('시작일 이후', () => {
      const filters: SearchFilters = {
        query: 'developer',
        created: { from: '2020-01-01' },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer created:>=2020-01-01');
    });

    it('종료일 이전', () => {
      const filters: SearchFilters = {
        query: 'developer',
        created: { to: '2023-12-31' },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer created:<=2023-12-31');
    });

    it('날짜 범위', () => {
      const filters: SearchFilters = {
        query: 'developer',
        created: { from: '2020-01-01', to: '2023-12-31' },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer created:2020-01-01..2023-12-31');
    });

    it('정확한 날짜', () => {
      const filters: SearchFilters = {
        query: 'developer',
        created: { exact: '2022-06-15' },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer created:2022-06-15');
    });
  });

  describe('7. 팔로워 수 필터 (followers)', () => {
    it('최소값 이상', () => {
      const filters: SearchFilters = {
        query: 'developer',
        followers: { min: 100 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer followers:>=100');
    });

    it('최대값 이하', () => {
      const filters: SearchFilters = {
        query: 'developer',
        followers: { max: 1000 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer followers:<=1000');
    });

    it('범위 (min-max)', () => {
      const filters: SearchFilters = {
        query: 'developer',
        followers: { min: 50, max: 200 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer followers:50..200');
    });

    it('정확한 값', () => {
      const filters: SearchFilters = {
        query: 'developer',
        followers: { exact: 150 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer followers:150');
    });
  });

  describe('8. 후원 가능 여부 (isSponsored)', () => {
    it('후원 가능한 사용자만', () => {
      const filters: SearchFilters = {
        query: 'developer',
        isSponsored: true,
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer is:sponsorable');
    });

    it('false일 때는 쿼리에 포함되지 않음', () => {
      const filters: SearchFilters = {
        query: 'developer',
        isSponsored: false,
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer');
    });
  });

  describe('복합 검색', () => {
    it('모든 필터 조합', () => {
      const filters: SearchFilters = {
        query: 'react developer',
        type: 'user',
        searchIn: ['name', 'email'],
        repos: { min: 10, max: 100 },
        location: 'San Francisco',
        language: 'JavaScript',
        created: { from: '2020-01-01', to: '2023-12-31' },
        followers: { min: 50, max: 500 },
        isSponsored: true,
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe(
        'react developer type:user in:name in:email repos:10..100 location:"San Francisco" language:JavaScript created:2020-01-01..2023-12-31 followers:50..500 is:sponsorable'
      );
    });

    it('일부 필터만 사용', () => {
      const filters: SearchFilters = {
        query: 'javascript',
        type: 'user',
        location: 'Seoul',
        repos: { min: 5 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('javascript type:user location:Seoul repos:>=5');
    });

    it('서울의 TypeScript 개발자', () => {
      const filters: SearchFilters = {
        query: 'developer',
        type: 'user',
        location: 'Seoul',
        language: 'TypeScript',
        repos: { min: 10 },
        followers: { min: 100 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe(
        'developer type:user location:Seoul language:TypeScript repos:>=10 followers:>=100'
      );
    });
  });

  describe('정렬 옵션', () => {
    it('팔로워 수 내림차순', () => {
      const filters: SearchFilters = {
        query: 'developer',
        sort: 'followers',
        sortOrder: 'desc',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.sort).toBe('followers');
      expect(result.order).toBe('desc');
    });

    it('리포지토리 수 오름차순', () => {
      const filters: SearchFilters = {
        query: 'developer',
        sort: 'repositories',
        sortOrder: 'asc',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.sort).toBe('repositories');
      expect(result.order).toBe('asc');
    });

    it('가입일 순서', () => {
      const filters: SearchFilters = {
        query: 'developer',
        sort: 'joined',
        sortOrder: 'desc',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.sort).toBe('joined');
      expect(result.order).toBe('desc');
    });

    it('best-match는 쿼리에 포함되지 않음', () => {
      const filters: SearchFilters = {
        query: 'developer',
        sort: 'best-match',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.sort).toBeUndefined();
    });
  });

  describe('페이지네이션', () => {
    it('페이지와 perPage 설정', () => {
      const filters: SearchFilters = {
        query: 'developer',
        page: 2,
        perPage: 50,
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.page).toBe(2);
      expect(result.per_page).toBe(50);
    });

    it('기본값 (undefined)', () => {
      const filters: SearchFilters = {
        query: 'developer',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.page).toBeUndefined();
      expect(result.per_page).toBeUndefined();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 검색어', () => {
      const filters: SearchFilters = {
        query: '',
        type: 'user',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('type:user');
    });

    it('모든 필터가 비어있음', () => {
      const filters: SearchFilters = {
        query: 'developer',
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer');
    });

    it('범위 필터에서 exact 우선', () => {
      const filters: SearchFilters = {
        query: 'developer',
        repos: { exact: 42, min: 10, max: 100 },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer repos:42');
    });

    it('날짜 필터에서 exact 우선', () => {
      const filters: SearchFilters = {
        query: 'developer',
        created: { exact: '2022-01-01', from: '2020-01-01', to: '2023-12-31' },
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer created:2022-01-01');
    });

    it('빈 searchIn 배열', () => {
      const filters: SearchFilters = {
        query: 'developer',
        searchIn: [],
      };

      const result = SearchQueryBuilder.build(filters);

      expect(result.q).toBe('developer');
    });
  });
});
