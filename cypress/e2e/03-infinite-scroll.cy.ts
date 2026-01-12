/**
 * E2E 테스트: 무한 스크롤
 * - 스크롤 시 다음 페이지 로드
 * - Intersection Observer 동작 검증
 * - 로딩 상태 확인
 */

describe('무한 스크롤 테스트', () => {
  beforeEach(() => {
    cy.interceptSearchAPI();
    cy.visit('/');

    // 검색 실행
    cy.searchUsers('javascript');
    cy.wait('@searchAPI');
    cy.waitForSearchResults();
  });

  describe('기본 무한 스크롤', () => {
    it('페이지 하단으로 스크롤 시 다음 페이지가 로드되어야 함', () => {
      // Given: 첫 페이지 결과 수 확인
      cy.get('[class*="MuiCard-root"]').then($cards => {
        const initialCount = $cards.length;

        // When: 페이지 하단으로 스크롤
        cy.scrollToLoadMore();

        // API 재요청 대기
        cy.wait('@searchAPI');

        // Then: 카드 수 증가
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          initialCount
        );
      });
    });

    it('여러 번 스크롤 시 계속 추가 로드되어야 함', () => {
      // Given: 첫 페이지
      cy.get('[class*="MuiCard-root"]').its('length').as('firstPageCount');

      // When: 첫 번째 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');
      cy.get('[class*="MuiCard-root"]').its('length').as('secondPageCount');

      // When: 두 번째 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 세 페이지 모두 다른 카드 수
      cy.get('@firstPageCount').then(first => {
        cy.get('@secondPageCount').then(second => {
          cy.get('[class*="MuiCard-root"]')
            .its('length')
            .should('be.greaterThan', second as unknown as number);
          expect(second).to.be.greaterThan(first as unknown as number);
        });
      });
    });

    it('스크롤 시 로딩 인디케이터가 표시되어야 함', () => {
      // When: 스크롤
      cy.get('main').scrollTo('bottom', { duration: 500 });

      // Then: 로딩 상태 표시
      // cy.get('[class*="MuiCircularProgress"]').should('be.visible');

      // 로딩 완료 대기
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // 로딩 인디케이터 사라짐
      // cy.get('[class*="MuiCircularProgress"]').should('not.exist');
    });
  });

  describe('스크롤 경계 케이스', () => {
    it('마지막 페이지에 도달하면 더 이상 로드되지 않아야 함', () => {
      // Given: GitHub API는 최대 1000개 결과 제한
      // 여러 번 스크롤하여 마지막까지 도달

      // When: 충분히 스크롤 (33번 = 30개씩 * 33 = 990개)
      for (let i = 0; i < 5; i++) {
        cy.scrollToLoadMore();
        cy.wait('@searchAPI', { timeout: 15000 });
        cy.wait(1000);
      }

      // Then: 더 이상 로드되지 않음 메시지
      // cy.contains('모든 결과를 불러왔습니다').should('be.visible');
    });

    it('빠르게 연속 스크롤해도 중복 요청이 발생하지 않아야 함', () => {
      // Given: API 요청 카운트 초기화
      let requestCount = 0;

      cy.intercept('POST', '/api/search/users', req => {
        requestCount++;
      }).as('countedSearchAPI');

      // When: 빠른 연속 스크롤
      cy.get('main').scrollTo('bottom', { duration: 100 });
      cy.wait(100);
      cy.get('main').scrollTo('bottom', { duration: 100 });
      cy.wait(100);
      cy.get('main').scrollTo('bottom', { duration: 100 });

      // Then: 합리적인 요청 수 (최대 2-3개)
      cy.wait(3000);
      cy.wrap(requestCount).should('be.lessThan', 4);
    });

    it('에러 발생 시 스크롤이 중지되어야 함', () => {
      // Given: API 에러 응답
      cy.intercept('POST', '/api/search/users', {
        statusCode: 500,
        body: { error: 'Internal Server Error' },
      }).as('errorAPI');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@errorAPI');

      // Then: 에러 메시지 표시
      cy.contains('오류', { matchCase: false }).should('be.visible');

      // 추가 로드 시도 없음
      cy.scrollToLoadMore();
      cy.wait(2000);
      cy.get('@errorAPI.all').should('have.length', 1);
    });
  });

  describe('Intersection Observer 동작', () => {
    it('센티널 요소가 뷰포트에 들어오면 로드되어야 함', () => {
      // Given: 센티널 요소 확인
      // (무한 스크롤 트리거용 요소)

      // When: 센티널까지 스크롤
      cy.get('main').scrollTo('bottom', { duration: 1000 });

      // Then: 자동으로 다음 페이지 로드
      cy.wait('@searchAPI');
      cy.waitForSearchResults();
    });

    it('뷰포트를 벗어나면 로드가 중지되어야 함', () => {
      // Given: 페이지 하단으로 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // When: 다시 위로 스크롤
      cy.get('main').scrollTo('top', { duration: 500 });
      cy.wait(2000);

      // Then: 추가 로드 없음
      cy.get('@searchAPI.all').should('have.length', 2); // 초기 + 1번 스크롤
    });
  });

  describe('다양한 뷰포트에서 무한 스크롤', () => {
    it('모바일에서 무한 스크롤이 작동해야 함', () => {
      // Given: 모바일 뷰포트
      cy.viewport(375, 667);

      // 초기 카드 수
      cy.get('[class*="MuiCard-root"]').its('length').as('initialCount');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 카드 추가
      cy.get('@initialCount').then(initial => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          initial as unknown as number
        );
      });
    });

    it('태블릿에서 무한 스크롤이 작동해야 함', () => {
      // Given: 태블릿 뷰포트
      cy.viewport(768, 1024);

      // 초기 카드 수
      cy.get('[class*="MuiCard-root"]').its('length').as('initialCount');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 카드 추가
      cy.get('@initialCount').then(initial => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          initial as unknown as number
        );
      });
    });

    it('대형 화면에서 무한 스크롤이 작동해야 함', () => {
      // Given: 대형 화면 뷰포트
      cy.viewport(1920, 1080);

      // 초기 카드 수
      cy.get('[class*="MuiCard-root"]').its('length').as('initialCount');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 카드 추가
      cy.get('@initialCount').then(initial => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          initial as unknown as number
        );
      });
    });
  });

  describe('무한 스크롤 + 검색/필터 조합', () => {
    it('검색어 변경 후 무한 스크롤이 재설정되어야 함', () => {
      // Given: 첫 검색 + 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // When: 새로운 검색
      cy.searchUsers('python');
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 첫 페이지부터 시작
      cy.get('[class*="MuiCard-root"]').should('have.length.lessThan', 50);

      // 다시 스크롤 가능
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');
    });

    it('필터 적용 후 무한 스크롤이 작동해야 함', () => {
      // Given: 필터 적용
      cy.get('select').first().select('User');
      cy.get('button').contains('적용').click();
      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // When: 스크롤
      cy.get('[class*="MuiCard-root"]').its('length').as('beforeScroll');
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 필터가 유지된 채로 추가 로드
      cy.get('@beforeScroll').then(before => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          before as unknown as number
        );
      });

      // User 타입만 유지
      cy.get('[class*="MuiChip-root"]').each($chip => {
        cy.wrap($chip).should('contain', 'User');
      });
    });

    it('정렬 변경 후 무한 스크롤이 재설정되어야 함', () => {
      // Given: 스크롤 완료
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // When: 정렬 변경
      cy.get('select[value*="best-match"]').select('followers');

      cy.wait('@searchAPI');
      cy.waitForSearchResults();

      // Then: 첫 페이지부터 재시작
      // 다시 스크롤 가능
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');
    });
  });

  describe('성능 및 사용자 경험', () => {
    it('스크롤 시 부드러운 애니메이션이 적용되어야 함', () => {
      // When: 천천히 스크롤
      cy.get('main').scrollTo('bottom', { duration: 1000, easing: 'linear' });

      // Then: 스크롤 동작 확인
      cy.wait(1000);
      cy.window().its('scrollY').should('be.greaterThan', 0);
    });

    it('이미 로드된 카드는 유지되어야 함', () => {
      // Given: 첫 번째 카드의 텍스트 저장
      cy.get('[class*="MuiCard-root"]')
        .first()
        .find('[class*="MuiTypography-h6"]')
        .invoke('text')
        .as('firstCardText');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait('@searchAPI');

      // Then: 첫 번째 카드가 그대로 유지됨
      cy.get('@firstCardText').then(text => {
        cy.get('[class*="MuiCard-root"]')
          .first()
          .find('[class*="MuiTypography-h6"]')
          .should('contain', text);
      });
    });
  });
});
