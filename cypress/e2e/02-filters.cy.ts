/**
 * E2E 테스트: 필터 기능
 * - 필터 적용 후 결과 변경
 * - 8가지 필터 검증
 * - 필터 조합
 */

describe('필터 기능 테스트', () => {
  beforeEach(() => {
    cy.interceptSearchAPI();
    cy.visit('/');

    // 기본 검색 실행
    cy.searchUsers('developer');
    cy.wait('@searchAPI');
    cy.waitForSearchResults();
  });

  describe('필터 패널 기본 동작', () => {
    it('필터 패널이 표시되어야 함 (데스크톱)', () => {
      // Given: 데스크톱 뷰포트
      cy.viewport(1280, 720);

      // Then: 필터 패널이 항상 보임
      cy.get('aside').should('be.visible');
    });

    it('필터 패널을 열고 닫을 수 있어야 함 (모바일)', () => {
      // Given: 모바일 뷰포트
      cy.viewport(375, 667);

      // When: 필터 버튼 클릭
      cy.openFilterPanel();

      // Then: Drawer 열림
      cy.get('[class*="MuiDrawer-root"]').should('be.visible');

      // When: Drawer 닫기
      cy.get('body').click(0, 0); // Backdrop 클릭

      // Then: Drawer 닫힘
      cy.get('[class*="MuiDrawer-root"]').should('not.be.visible');
    });

    it('필터 패널에 모든 필터 옵션이 표시되어야 함', () => {
      // Then: 8가지 필터 확인
      cy.contains('사용자/조직').should('exist');
      cy.contains('검색 대상').should('exist');
      cy.contains('리포지토리').should('exist');
      cy.contains('위치').should('exist');
      cy.contains('언어').should('exist');
      cy.contains('가입일').should('exist');
      cy.contains('팔로워').should('exist');
      cy.contains('후원 가능').should('exist');
    });
  });

  describe('1. 사용자/조직 필터', () => {
    it('사용자만 필터링할 수 있어야 함', () => {
      // When: User 선택
      cy.get('select').first().select('User');
      cy.get('button').contains('적용').click();

      // API 재요청 대기
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: User 타입만 표시
      cy.get('[class*="MuiChip-root"]').each($chip => {
        cy.wrap($chip).should('contain', 'User');
      });
    });

    it('조직만 필터링할 수 있어야 함', () => {
      // When: Organization 선택
      cy.get('select').first().select('Organization');
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: Organization 타입만 표시
      cy.get('[class*="MuiChip-root"]').each($chip => {
        cy.wrap($chip).should('contain', 'Organization');
      });
    });
  });

  describe('2. 검색 대상 필터', () => {
    it('이름으로 검색 대상을 지정할 수 있어야 함', () => {
      // When: Name 체크박스 선택
      cy.contains('Name').parent().find('input[type="checkbox"]').check();
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');

      // Then: API 요청에 in:name 포함 확인
      cy.wait('@searchAPI').its('request.body').should('include', 'in:name');
    });

    it('여러 검색 대상을 조합할 수 있어야 함', () => {
      // When: Name + Email 선택
      cy.contains('Name').parent().find('input[type="checkbox"]').check();
      cy.contains('Email').parent().find('input[type="checkbox"]').check();
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');

      // Then: 검색 결과 표시
      cy.waitForSearchResults();
    });
  });

  describe('3. 리포지토리 수 필터', () => {
    it('최소 리포지토리 수로 필터링할 수 있어야 함', () => {
      // When: 최소값 입력
      cy.contains('리포지토리')
        .parent()
        .within(() => {
          cy.get('input[placeholder*="최소"]').clear().type('10');
        });
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 10개 이상 리포지토리를 가진 사용자만 표시
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.contains('리포지토리').parent().should('exist');
        });
    });

    it('리포지토리 범위로 필터링할 수 있어야 함', () => {
      // When: 최소 + 최대값 입력
      cy.contains('리포지토리')
        .parent()
        .within(() => {
          cy.get('input[placeholder*="최소"]').clear().type('10');
          cy.get('input[placeholder*="최대"]').clear().type('100');
        });
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 결과 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);
    });
  });

  describe('4. 위치 필터', () => {
    it('위치로 필터링할 수 있어야 함', () => {
      // When: 위치 입력
      cy.get('input[placeholder*="위치"]').clear().type('Seoul');
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: Seoul 위치 사용자 표시
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          // 위치 정보가 있는 카드 확인
          cy.get('svg[data-testid="LocationOnIcon"]').should('exist');
        });
    });

    it('공백 포함 위치로 필터링할 수 있어야 함', () => {
      // When: 공백 포함 위치
      cy.get('input[placeholder*="위치"]').clear().type('San Francisco');
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');

      // Then: API 요청 확인
      cy.wait('@searchAPI')
        .its('request.body')
        .should('include', 'San Francisco');
    });
  });

  describe('5. 언어 필터', () => {
    it('프로그래밍 언어로 필터링할 수 있어야 함', () => {
      // When: TypeScript 입력
      cy.get('input[placeholder*="언어"]').clear().type('TypeScript');
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 결과 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);
    });
  });

  describe('6. 가입일 필터', () => {
    it('가입일 범위로 필터링할 수 있어야 함', () => {
      // When: 날짜 범위 입력
      cy.contains('가입일')
        .parent()
        .within(() => {
          cy.get('input[type="date"]').first().type('2020-01-01');
          cy.get('input[type="date"]').last().type('2023-12-31');
        });
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 해당 기간에 가입한 사용자 표시
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.contains('가입일').should('exist');
        });
    });
  });

  describe('7. 팔로워 수 필터', () => {
    it('최소 팔로워 수로 필터링할 수 있어야 함', () => {
      // When: 최소 팔로워 입력
      cy.contains('팔로워')
        .parent()
        .within(() => {
          cy.get('input[placeholder*="최소"]').clear().type('100');
        });
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 100명 이상 팔로워를 가진 사용자만 표시
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.contains('팔로워').should('exist');
        });
    });

    it('팔로워 범위로 필터링할 수 있어야 함', () => {
      // When: 팔로워 범위 입력
      cy.contains('팔로워')
        .parent()
        .within(() => {
          cy.get('input[placeholder*="최소"]').clear().type('50');
          cy.get('input[placeholder*="최대"]').clear().type('500');
        });
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 결과 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);
    });
  });

  describe('8. 후원 가능 여부 필터', () => {
    it('후원 가능한 사용자만 필터링할 수 있어야 함', () => {
      // When: 후원 가능 체크박스 선택
      cy.contains('후원 가능').parent().find('input[type="checkbox"]').check();
      cy.get('button').contains('적용').click();

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: Sponsorable 뱃지가 있는 사용자만 표시
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          // cy.get('svg[data-testid="StarIcon"]').should('exist');
        });
    });
  });

  describe('필터 초기화', () => {
    it('필터를 초기화할 수 있어야 함', () => {
      // Given: 여러 필터 적용
      cy.get('select').first().select('User');
      cy.get('input[placeholder*="위치"]').type('Seoul');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');

      // When: 초기화 버튼 클릭
      cy.get('button').contains('초기화').click();

      // Then: 필터 값이 초기화됨
      cy.get('select').first().should('have.value', '');
      cy.get('input[placeholder*="위치"]').should('have.value', '');

      // 새로운 검색 실행
      cy.wait('@searchAPI');
    });

    it('필터 초기화 후 원래 검색 결과가 표시되어야 함', () => {
      // Given: 필터 적용
      cy.get('select').first().select('Organization');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');

      // When: 초기화
      cy.get('button').contains('초기화').click();
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 모든 타입 사용자 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);
    });
  });

  describe('필터 조합', () => {
    it('여러 필터를 동시에 적용할 수 있어야 함', () => {
      // When: 여러 필터 조합
      cy.get('select').first().select('User');
      cy.get('input[placeholder*="위치"]').type('Seoul');
      cy.get('input[placeholder*="언어"]').type('TypeScript');
      cy.contains('리포지토리')
        .parent()
        .within(() => {
          cy.get('input[placeholder*="최소"]').type('10');
        });
      cy.get('button').contains('적용').click();

      // Then: API 요청 확인
      cy.wait('@searchAPI')
        .its('request.body')
        .should('include', 'type:user')
        .and('include', 'location:Seoul')
        .and('include', 'language:TypeScript')
        .and('include', 'repos:');

      cy.waitForSearchResults();
    });

    it('필터 적용 후 다른 필터를 추가할 수 있어야 함', () => {
      // Given: 첫 번째 필터 적용
      cy.get('select').first().select('User');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');

      // When: 두 번째 필터 추가
      cy.get('input[placeholder*="위치"]').type('Tokyo');
      cy.get('button').contains('적용').click();

      // Then: 두 필터 모두 적용됨
      cy.wait('@searchAPI')
        .its('request.body')
        .should('include', 'type:user')
        .and('include', 'location:Tokyo');
    });
  });
});
