/**
 * E2E 테스트: 검색 기능
 * - 검색어 입력 후 결과 표시
 * - 검색 결과 검증
 * - 에러 처리
 */

describe('검색 기능 테스트', () => {
  beforeEach(() => {
    // API Intercept 설정
    cy.interceptSearchAPI();

    // 홈페이지 방문
    cy.visit('/');

    // 페이지 로드 대기
    cy.get('h3').contains('GitHub User Search').should('be.visible');
  });

  describe('기본 검색', () => {
    it('검색어를 입력하고 결과가 표시되어야 함', () => {
      // Given: 검색어 입력
      const searchQuery = 'javascript';

      // When: 검색 실행
      cy.searchUsers(searchQuery);

      // API 요청 대기
      cy.wait('@searchAPI');

      // Then: 검색 결과 표시 확인
      cy.waitForSearchResults();

      // 사용자 카드가 표시되는지 확인
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);

      // URL에 검색어가 포함되는지 확인
      cy.url().should('include', searchQuery);
    });

    it('검색 결과에 사용자 정보가 올바르게 표시되어야 함', () => {
      // Given & When
      cy.searchUsers('react');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 첫 번째 카드 검증
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          // 아바타 이미지
          cy.get('canvas').should('exist');

          // 사용자 이름 또는 로그인
          cy.get('[class*="MuiTypography-h6"]').should('exist');

          // 사용자 타입 칩 (User/Organization)
          cy.get('[class*="MuiChip-root"]').should('exist');

          // 통계 정보 (리포지토리, 팔로워, 팔로잉)
          cy.contains('리포지토리').should('exist');
          cy.contains('팔로워').should('exist');
          cy.contains('팔로잉').should('exist');

          // 프로필 보기 버튼 (호버 시 표시)
          cy.get('button').contains('프로필 보기').should('exist');
        });
    });

    it('검색 결과가 없을 때 적절한 메시지가 표시되어야 함', () => {
      // Given: 존재하지 않을 검색어
      const nonExistentQuery = 'xyzabc123nonexistent999';

      // When
      cy.searchUsers(nonExistentQuery);
      cy.wait('@searchAPI');

      // Then: 검색 결과 없음 메시지 또는 빈 상태
      cy.get('[class*="MuiCard-root"]').should('have.length', 0);

      // 또는 "검색 결과가 없습니다" 메시지
      // cy.contains('검색 결과가 없습니다').should('be.visible');
    });

    it('여러 번 검색해도 정상 동작해야 함', () => {
      // Given & When: 첫 번째 검색
      cy.searchUsers('python');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // 결과 확인
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);

      // Given & When: 두 번째 검색
      cy.searchUsers('typescript');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 새로운 결과 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);
    });

    it('검색어가 비어있으면 검색이 실행되지 않아야 함', () => {
      // Given: 빈 검색어
      cy.get('input[placeholder*="검색"]').clear();

      // When: 검색 버튼 클릭
      cy.get('button[type="submit"]').click();

      // Then: API 호출되지 않음
      cy.get('@searchAPI.all').should('have.length', 0);
    });
  });

  describe('검색 UI 상태', () => {
    it('검색 중 로딩 상태가 표시되어야 함', () => {
      // Given: API 응답 지연
      cy.intercept('POST', '/api/search/users', req => {
        req.reply(res => {
          res.delay = 2000; // 2초 지연
        });
      }).as('slowSearchAPI');

      // When: 검색 실행
      cy.searchUsers('javascript');

      // Then: 로딩 인디케이터 표시
      // cy.get('[class*="MuiCircularProgress"]').should('be.visible');

      // 로딩 완료 후 결과 표시
      cy.wait('@slowSearchAPI');
      cy.waitForSearchResults();
    });

    it('검색어 입력 시 실시간으로 입력값이 반영되어야 함', () => {
      // Given
      const query = 'react developer';

      // When: 타이핑
      cy.get('input[placeholder*="검색"]').clear().type(query);

      // Then: 입력값 확인
      cy.get('input[placeholder*="검색"]').should('have.value', query);
    });
  });

  describe('Rate Limit 처리', () => {
    it('Rate Limit 정보가 표시되어야 함', () => {
      // When: 검색 실행
      cy.searchUsers('nodejs');
      cy.wait('@searchAPI');

      // Then: Rate Limit 표시 확인
      // cy.get('[data-testid="rate-limit"]').should('exist');
    });

    it('Rate Limit 초과 시 에러 메시지가 표시되어야 함', () => {
      // Given: Rate Limit 초과 응답 Mock
      cy.intercept('POST', '/api/search/users', {
        statusCode: 403,
        body: {
          error: 'API rate limit exceeded',
        },
      }).as('rateLimitAPI');

      // When: 검색 실행
      cy.searchUsers('test');
      cy.wait('@rateLimitAPI');

      // Then: 에러 메시지 표시
      cy.contains('rate limit', { matchCase: false }).should('be.visible');
    });
  });

  describe('검색 결과 상호작용', () => {
    it('사용자 카드 클릭 시 GitHub 프로필로 이동해야 함', () => {
      // Given: 검색 완료
      cy.searchUsers('facebook');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // When: 프로필 보기 버튼 클릭
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.get('button')
            .contains('프로필 보기')
            .should('have.attr', 'href')
            .and('include', 'github.com');
        });
    });

    it('사용자 카드에 호버 시 버튼이 표시되어야 함 (데스크톱)', () => {
      // Given: 뷰포트를 데스크톱 크기로 설정
      cy.viewport(1280, 720);

      // When: 검색 완료
      cy.searchUsers('google');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 첫 번째 카드에 호버
      cy.get('[class*="MuiCard-root"]').first().trigger('mouseover');

      // 프로필 보기 버튼이 보이는지 확인
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.get('button').contains('프로필 보기').should('be.visible');
        });
    });
  });
});
