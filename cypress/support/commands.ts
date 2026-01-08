/// <reference types="cypress" />

/**
 * 커스텀 Cypress 커맨드 정의
 */

// GitHub 검색 페이지 방문
Cypress.Commands.add('visitSearch', () => {
  cy.visit('/');
});

// 검색 입력
Cypress.Commands.add('searchUsers', (query: string) => {
  cy.get('[data-testid="search-input"]').clear().type(query);
  cy.get('[data-testid="search-button"]').click();
});

// TypeScript 타입 정의
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * 검색 페이지 방문
       * @example cy.visitSearch()
       */
      visitSearch(): Chainable<void>;

      /**
       * 사용자 검색 실행
       * @example cy.searchUsers('octocat')
       */
      searchUsers(query: string): Chainable<void>;
    }
  }
}

export {};
