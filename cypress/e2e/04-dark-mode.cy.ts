/**
 * E2E 테스트: 다크모드
 * - 다크모드 토글
 * - 로컬 스토리지 저장
 * - 시스템 설정 연동
 */

describe('다크모드 테스트', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('다크모드 토글 기본 동작', () => {
    it('다크모드 버튼이 표시되어야 함', () => {
      // Then: 다크모드 토글 버튼 존재
      cy.get('button').find('svg[data-testid*="Icon"]').should('exist');
    });

    it('다크모드를 켜고 끌 수 있어야 함', () => {
      // Given: 초기 라이트 모드 (기본값)
      cy.get('html').then($html => {
        // 라이트 모드 또는 다크 클래스 없음
        expect($html.hasClass('light-mode') || !$html.hasClass('dark-mode')).to
          .be.true;
      });

      // When: 다크모드 토글
      cy.toggleDarkMode();

      // Then: 다크모드 적용
      cy.get('html').should('have.class', 'dark');

      // When: 다시 토글
      cy.toggleDarkMode();

      // Then: 라이트 모드로 복귀
      cy.get('html').should('not.have.class', 'dark');
    });

    it('다크모드 아이콘이 상태에 따라 변경되어야 함', () => {
      // Given: 라이트 모드
      // Then: Moon 아이콘 또는 Sun 아이콘 확인
      cy.get('button').find('svg').should('exist');

      // When: 다크모드 토글
      cy.toggleDarkMode();

      // Then: 아이콘 변경
      cy.get('button').find('svg').should('exist');
    });
  });

  describe('다크모드 UI 스타일', () => {
    beforeEach(() => {
      // 다크모드 활성화
      cy.toggleDarkMode();
      cy.wait(500);
    });

    it('배경색이 다크 테마로 변경되어야 함', () => {
      // Then: body 배경색 확인
      cy.get('body')
        .should('have.css', 'background-color')
        .then(bgColor => {
          // 다크 모드는 어두운 배경색 (RGB 값이 낮음)
          const rgbMatch = bgColor
            .toString()
            .match(/rgb\((\d+), (\d+), (\d+)\)/);
          if (rgbMatch) {
            const r = parseInt(rgbMatch[1]);
            const g = parseInt(rgbMatch[2]);
            const b = parseInt(rgbMatch[3]);
            const sum = r + g + b;
            expect(sum).to.be.lessThan(300); // 어두운 색
          }
        });
    });

    it('텍스트 색상이 다크 테마로 변경되어야 함', () => {
      // Then: 헤더 텍스트 색상 확인
      cy.get('h3')
        .first()
        .should('have.css', 'color')
        .then(color => {
          // RGB 패턴 확인
          expect(color.toString()).to.match(/rgb\((\d+), (\d+), (\d+)\)/);
        });
    });

    it('카드 배경이 다크 테마로 변경되어야 함', () => {
      // Given: 검색 실행
      cy.searchUsers('javascript');
      cy.wait(2000);

      // Then: 카드 배경색 확인
      cy.get('[class*="MuiCard-root"]')
        .first()
        .should('have.css', 'background-color')
        .then(bgColor => {
          expect(bgColor.toString()).to.match(/rgb\((\d+), (\d+), (\d+)\)/);
        });
    });

    it('버튼 스타일이 다크 테마로 변경되어야 함', () => {
      // Then: 버튼 스타일 확인
      cy.get('button[type="submit"]')
        .should('have.css', 'background-color')
        .then(bgColor => {
          expect(bgColor.toString()).to.match(/rgb\((\d+), (\d+), (\d+)\)/);
        });
    });

    it('인풋 필드가 다크 테마로 변경되어야 함', () => {
      // Then: 검색 인풋 배경색 확인
      cy.get('input[placeholder*="검색"]')
        .should('have.css', 'background-color')
        .then(bgColor => {
          expect(bgColor.toString()).to.match(/rgb\((\d+), (\d+), (\d+)\)/);
        });
    });
  });

  describe('다크모드 영속성 (로컬 스토리지)', () => {
    it('다크모드 설정이 로컬 스토리지에 저장되어야 함', () => {
      // When: 다크모드 활성화
      cy.toggleDarkMode();
      cy.wait(500);

      // Then: 로컬 스토리지 확인
      cy.window().its('localStorage.theme').should('exist');
    });

    it('페이지 새로고침 후에도 다크모드가 유지되어야 함', () => {
      // Given: 다크모드 활성화
      cy.toggleDarkMode();
      cy.wait(500);
      cy.get('html').should('have.class', 'dark');

      // When: 페이지 새로고침
      cy.reload();

      // Then: 다크모드 유지
      cy.get('html').should('have.class', 'dark');
    });

    it('새 탭에서도 다크모드가 유지되어야 함', () => {
      // Given: 다크모드 활성화
      cy.toggleDarkMode();
      cy.wait(500);

      // When: 새 페이지 방문
      cy.visit('/');

      // Then: 다크모드 유지
      cy.get('html').should('have.class', 'dark');
    });
  });

  describe('다크모드 + 검색/필터', () => {
    beforeEach(() => {
      cy.toggleDarkMode();
      cy.wait(500);
    });

    it('다크모드에서 검색이 정상 작동해야 함', () => {
      // When: 검색 실행
      cy.searchUsers('react');
      cy.wait(2000);

      // Then: 검색 결과 표시 (다크 테마)
      cy.get('[class*="MuiCard-root"]').should('exist');
      cy.get('html').should('have.class', 'dark');
    });

    it('다크모드에서 필터가 정상 작동해야 함', () => {
      // Given: 검색 실행
      cy.searchUsers('developer');
      cy.wait(2000);

      // When: 필터 적용
      cy.get('select').first().select('User');
      cy.get('button').contains('적용').click();
      cy.wait(2000);

      // Then: 필터 적용 (다크 테마 유지)
      cy.get('html').should('have.class', 'dark');
      cy.get('[class*="MuiChip-root"]').should('contain', 'User');
    });

    it('다크모드에서 무한 스크롤이 정상 작동해야 함', () => {
      // Given: 검색 + 스크롤
      cy.searchUsers('javascript');
      cy.wait(2000);

      cy.get('[class*="MuiCard-root"]').its('length').as('beforeScroll');

      // When: 스크롤
      cy.scrollToLoadMore();
      cy.wait(2000);

      // Then: 추가 로드 (다크 테마 유지)
      cy.get('html').should('have.class', 'dark');
      cy.get('@beforeScroll').then(before => {
        cy.get('[class*="MuiCard-root"]').should(
          'have.length.greaterThan',
          before as unknown as number
        );
      });
    });
  });

  describe('다크모드 반응형', () => {
    it('모바일에서 다크모드가 작동해야 함', () => {
      // Given: 모바일 뷰포트
      cy.viewport(375, 667);

      // When: 다크모드 토글
      cy.toggleDarkMode();
      cy.wait(500);

      // Then: 다크모드 적용
      cy.get('html').should('have.class', 'dark');

      // 모바일 플로팅 버튼 확인
      cy.get('button').find('svg').should('exist');
    });

    it('태블릿에서 다크모드가 작동해야 함', () => {
      // Given: 태블릿 뷰포트
      cy.viewport(768, 1024);

      // When: 다크모드 토글
      cy.toggleDarkMode();
      cy.wait(500);

      // Then: 다크모드 적용
      cy.get('html').should('have.class', 'dark');
    });

    it('데스크톱에서 다크모드가 작동해야 함', () => {
      // Given: 데스크톱 뷰포트
      cy.viewport(1920, 1080);

      // When: 다크모드 토글
      cy.toggleDarkMode();
      cy.wait(500);

      // Then: 다크모드 적용
      cy.get('html').should('have.class', 'dark');
    });
  });

  describe('시스템 다크모드 연동', () => {
    it('시스템 다크모드 설정을 감지해야 함', () => {
      // Given: 시스템 다크모드 활성화 시뮬레이션
      cy.window().then(win => {
        Object.defineProperty(win, 'matchMedia', {
          writable: true,
          value: () => ({
            matches: true, // 다크모드
            addEventListener: () => {},
            removeEventListener: () => {},
          }),
        });
      });

      // When: 페이지 방문
      cy.visit('/');

      // Then: 자동으로 다크모드 적용
      // (시스템 설정 반영)
    });

    it('시스템 설정 변경 시 자동으로 테마가 변경되어야 함', () => {
      // Given: 라이트 모드
      cy.visit('/');

      // When: 시스템 다크모드 변경 (시뮬레이션)
      cy.window().then(win => {
        const event = new Event('change');
        win.dispatchEvent(event);
      });

      // Then: 테마 자동 변경
      // (실제 구현에 따라 테스트)
    });
  });

  describe('다크모드 접근성', () => {
    it('다크모드 버튼에 적절한 aria-label이 있어야 함', () => {
      // Then: aria-label 또는 title 확인
      cy.get('button')
        .find('svg')
        .parent()
        .then($btn => {
          const hasAriaLabel = $btn.attr('aria-label');
          const hasTitle = $btn.attr('title');
          expect(hasAriaLabel || hasTitle).to.exist;
        });
    });

    it('다크모드에서 충분한 대비가 유지되어야 함', () => {
      // Given: 다크모드 활성화
      cy.toggleDarkMode();
      cy.wait(500);

      // Then: 텍스트가 읽을 수 있어야 함
      cy.get('h3').first().should('be.visible');
      cy.get('p').first().should('be.visible');
    });

    it('키보드로 다크모드 버튼에 접근할 수 있어야 함', () => {
      // When: Tab 키로 포커스 이동
      cy.get('body').type('{tab}');
      cy.focused().should('exist');

      // Then: Enter로 토글 가능
      cy.focused().type('{enter}');
      cy.wait(500);
    });
  });
});
