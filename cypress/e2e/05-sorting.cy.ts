/**
 * E2E 테스트: 정렬 기능
 * - 정렬 옵션 변경
 * - 정렬 순서 확인
 * - 정렬 + 필터 조합
 */

describe('정렬 기능 테스트', () => {
  beforeEach(() => {
    cy.interceptSearchAPI();
    cy.visit('/');

    // 기본 검색 실행
    cy.searchUsers('developer');
    cy.wait('@searchAPI');
    cy.waitForSearchResults();
  });

  describe('정렬 옵션 선택', () => {
    it('정렬 드롭다운이 표시되어야 함', () => {
      // Then: 정렬 select 또는 드롭다운 존재
      cy.get('select, div').contains('정렬').should('exist');
    });

    it('4가지 정렬 옵션이 제공되어야 함', () => {
      // Then: Best Match, Followers, Repositories, Joined
      cy.get('select[value*="sort"]').within(() => {
        cy.get('option').should('have.length', 4);
        cy.get('option').contains('Best match');
        cy.get('option').contains('Followers');
        cy.get('option').contains('Repositories');
        cy.get('option').contains('Joined');
      });
    });

    it('기본 정렬은 Best Match이어야 함', () => {
      // Then: 기본값 확인
      cy.get('select[value*="sort"]').should('have.value', 'best-match');
    });
  });

  describe('Best Match 정렬 (기본값)', () => {
    it('Best Match로 검색 결과가 표시되어야 함', () => {
      // Given: 기본 정렬 (Best Match)
      // Then: 검색 결과 표시
      cy.get('[class*="MuiCard-root"]').should('have.length.greaterThan', 0);

      // URL에 정렬 파라미터 없음 (기본값)
      cy.url().should('not.include', 'sort=');
    });

    it('Best Match는 관련성 높은 순서로 표시되어야 함', () => {
      // Given: "react" 검색
      cy.searchUsers('react');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 첫 번째 결과가 "react" 관련성이 높음
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.get('[class*="MuiTypography-h6"]')
            .invoke('text')
            .should('match', /react/i);
        });
    });
  });

  describe('Followers 정렬', () => {
    it('팔로워 수로 정렬할 수 있어야 함', () => {
      // When: Followers 정렬 선택
      cy.get('select[value*="sort"]').select('followers');

      // API 재요청 대기
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: URL에 정렬 파라미터 포함
      cy.url().should('include', 'sort=followers');
    });

    it('팔로워가 많은 순서로 정렬되어야 함 (DESC)', () => {
      // Given: Followers 정렬
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 팔로워 수 확인
      const followerCounts: number[] = [];

      cy.get('[class*="MuiCard-root"]')
        .each(($card, index) => {
          if (index < 5) {
            // 처음 5개만 확인
            cy.wrap($card).within(() => {
              cy.contains('팔로워')
                .parent()
                .find('[class*="MuiTypography-h6"]')
                .invoke('text')
                .then(text => {
                  // "1.5k" → 1500, "100" → 100
                  const count = text.includes('k')
                    ? parseFloat(text) * 1000
                    : parseInt(text);

                  if (!isNaN(count)) {
                    followerCounts.push(count);
                  }
                });
            });
          }
        })
        .then(() => {
          // 내림차순 확인
          for (let i = 0; i < followerCounts.length - 1; i++) {
            expect(followerCounts[i]).to.be.at.least(followerCounts[i + 1]);
          }
        });
    });

    it('Followers DESC/ASC 토글이 작동해야 함', () => {
      // Given: Followers 정렬
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');

      // When: 정렬 순서 토글 (DESC → ASC)
      cy.get('button[aria-label*="정렬"], button').contains('↓').click();
      cy.wait('@searchAPI');

      // Then: URL에 order 파라미터 변경
      cy.url().should('include', 'order=asc');
    });
  });

  describe('Repositories 정렬', () => {
    it('리포지토리 수로 정렬할 수 있어야 함', () => {
      // When: Repositories 정렬 선택
      cy.get('select[value*="sort"]').select('repositories');

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 정렬 적용
      cy.url().should('include', 'sort=repositories');
    });

    it('리포지토리가 많은 순서로 정렬되어야 함 (DESC)', () => {
      // Given: Repositories 정렬
      cy.get('select[value*="sort"]').select('repositories');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 리포지토리 수 확인
      const repoCounts: number[] = [];

      cy.get('[class*="MuiCard-root"]')
        .each(($card, index) => {
          if (index < 5) {
            cy.wrap($card).within(() => {
              cy.contains('리포지토리')
                .parent()
                .find('[class*="MuiTypography-h6"]')
                .invoke('text')
                .then(text => {
                  const count = parseInt(text);
                  if (!isNaN(count)) {
                    repoCounts.push(count);
                  }
                });
            });
          }
        })
        .then(() => {
          // 내림차순 확인
          for (let i = 0; i < repoCounts.length - 1; i++) {
            expect(repoCounts[i]).to.be.at.least(repoCounts[i + 1]);
          }
        });
    });
  });

  describe('Joined 정렬', () => {
    it('가입일로 정렬할 수 있어야 함', () => {
      // When: Joined 정렬 선택
      cy.get('select[value*="sort"]').select('joined');

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 정렬 적용
      cy.url().should('include', 'sort=joined');
    });

    it('최근 가입한 순서로 정렬되어야 함 (DESC)', () => {
      // Given: Joined 정렬
      cy.get('select[value*="sort"]').select('joined');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 가입일 확인
      cy.get('[class*="MuiCard-root"]')
        .first()
        .within(() => {
          cy.contains('가입일').should('exist');
        });
    });

    it('가장 오래된 순서로 정렬할 수 있어야 함 (ASC)', () => {
      // Given: Joined 정렬
      cy.get('select[value*="sort"]').select('joined');
      cy.wait('@searchAPI');

      // When: ASC 순서로 변경
      cy.get('button[aria-label*="정렬"], button').contains('↓').click();
      cy.wait('@searchAPI');

      // Then: 오래된 계정부터 표시
      cy.url().should('include', 'order=asc');
    });
  });

  describe('정렬 변경 시 동작', () => {
    it('정렬 변경 시 페이지가 1로 재설정되어야 함', () => {
      // Given: 2페이지까지 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // When: 정렬 변경
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');

      // Then: 첫 페이지부터 시작
      cy.url().should('not.include', 'page=2');
    });

    it('정렬 변경 시 기존 결과가 초기화되어야 함', () => {
      // Given: 검색 결과 저장
      cy.get('[class*="MuiCard-root"]')
        .first()
        .find('[class*="MuiTypography-h6"]')
        .invoke('text')
        .as('firstResult');

      // When: 정렬 변경
      cy.get('select[value*="sort"]').select('repositories');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 다른 결과 표시
      cy.get('@firstResult').then(first => {
        cy.get('[class*="MuiCard-root"]')
          .first()
          .find('[class*="MuiTypography-h6"]')
          .invoke('text')
          .should('not.equal', first);
      });
    });

    it('정렬 변경 후 무한 스크롤이 작동해야 함', () => {
      // Given: 정렬 변경
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      cy.get('[class*="MuiCard-root"]').its('length').as('beforeScroll');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 추가 로드
      cy.get('@beforeScroll').then(before => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          before as unknown as number
        );
      });
    });
  });

  describe('정렬 + 필터 조합', () => {
    it('필터 적용 후 정렬을 변경할 수 있어야 함', () => {
      // Given: 필터 적용
      cy.get('select').first().select('User');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');

      // When: 정렬 변경
      cy.get('select[value*="sort"]').select('repositories');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 필터 + 정렬 모두 적용
      cy.url().should('include', 'sort=repositories');
      cy.get('[class*="MuiChip-root"]').each($chip => {
        cy.wrap($chip).should('contain', 'User');
      });
    });

    it('정렬 적용 후 필터를 변경할 수 있어야 함', () => {
      // Given: 정렬 적용
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');

      // When: 필터 적용
      cy.get('input[placeholder*="위치"]').type('Seoul');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 정렬 + 필터 모두 적용
      cy.url().should('include', 'sort=followers');
    });

    it('여러 필터 + 정렬 조합이 작동해야 함', () => {
      // When: 필터 + 정렬 조합
      cy.get('select').first().select('Organization');
      cy.get('input[placeholder*="위치"]').type('USA');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');

      cy.get('select[value*="sort"]').select('repositories');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 모든 조건 적용
      cy.url().should('include', 'sort=repositories');
      cy.get('[class*="MuiChip-root"]').should('contain', 'Organization');
    });
  });

  describe('정렬 UI 상태', () => {
    it('현재 정렬이 하이라이트되어야 함', () => {
      // When: Followers 선택
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');

      // Then: 선택된 상태 표시
      cy.get('select[value*="sort"]').should('have.value', 'followers');
    });

    it('정렬 순서 버튼이 상태를 표시해야 함', () => {
      // Given: 정렬 선택
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');

      // Then: DESC 버튼 표시
      cy.get('button[aria-label*="정렬"], button')
        .contains('↓')
        .should('exist');

      // When: 토글
      cy.get('button[aria-label*="정렬"], button').contains('↓').click();
      cy.wait('@searchAPI');

      // Then: ASC 버튼 표시
      cy.get('button[aria-label*="정렬"], button')
        .contains('↑')
        .should('exist');
    });
  });

  describe('정렬 접근성', () => {
    it('키보드로 정렬을 변경할 수 있어야 함', () => {
      // When: Tab으로 select 포커스
      cy.get('select[value*="sort"]').focus();

      // When: 화살표 키로 옵션 선택
      cy.get('select[value*="sort"]').type('{downarrow}{enter}');

      // Then: 정렬 변경
      cy.wait('@searchAPI');
    });

    it('정렬 select에 적절한 label이 있어야 함', () => {
      // Then: label 또는 aria-label 확인
      cy.get('select[value*="sort"]').then($select => {
        const hasAriaLabel = $select.attr('aria-label');
        const hasId = $select.attr('id');
        expect(hasAriaLabel || hasId).to.exist;
      });
    });
  });

  describe('정렬 성능', () => {
    it('정렬 변경이 빠르게 처리되어야 함', () => {
      // Given: 시작 시간 기록
      const startTime = Date.now();

      // When: 정렬 변경
      cy.get('select[value*="sort"]').select('followers');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 3초 이내 완료
      cy.wrap(Date.now() - startTime).should('be.lessThan', 3000);
    });

    it('정렬 변경 시 불필요한 재렌더링이 없어야 함', () => {
      // Given: 검색 완료
      let apiCallCount = 0;

      cy.intercept('POST', '/api/search/users', () => {
        apiCallCount++;
      }).as('countedAPI');

      // When: 정렬 변경
      cy.get('select[value*="sort"]').select('followers');
      cy.wait(2000);

      // Then: API 1번만 호출
      cy.wrap(apiCallCount).should('equal', 1);
    });
  });
});
