/**
 * Cypress 커스텀 커맨드
 */

// Cypress 타입 정의 확장
declare global {
  namespace Cypress {
    interface Chainable {
      searchUsers(query: string): Chainable<void>;
      openFilterPanel(): Chainable<void>;
      waitForSearchResults(): Chainable<void>;
      toggleDarkMode(): Chainable<void>;
      scrollToLoadMore(): Chainable<void>;
      interceptSearchAPI(): Chainable<void>;
      selectSort(sortOption: string): Chainable<void>;
      applyFilter(filterType: string, value: string | number): Chainable<void>;
    }
  }
}

Cypress.Commands.add('searchUsers', (query: string) => {
  cy.get('input[placeholder*="검색"]').clear().type(query);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('openFilterPanel', () => {
  cy.get('button').contains('필터').click();
});

Cypress.Commands.add('waitForSearchResults', () => {
  cy.get('[class*="MuiCard-root"]', { timeout: 10000 }).should('exist');
});

Cypress.Commands.add('toggleDarkMode', () => {
  cy.get('button[aria-label]').last().click();
});

Cypress.Commands.add('scrollToLoadMore', () => {
  cy.get('main').scrollTo('bottom', { duration: 500 });
  cy.wait(2000);
});

Cypress.Commands.add('interceptSearchAPI', () => {
  cy.intercept('POST', '/api/search/users').as('searchAPI');
});

Cypress.Commands.add('selectSort', (sortOption: string) => {
  cy.get('div[role="button"]').contains('정렬').click();
  cy.get('li[role="option"]').contains(sortOption).click();
});

Cypress.Commands.add(
  'applyFilter',
  (filterType: string, value: string | number) => {
    if (filterType === 'type') {
      cy.get('select')
        .first()
        .select(value as string);
    } else if (filterType === 'location') {
      cy.get('input[placeholder*="위치"]')
        .clear()
        .type(value as string);
    } else if (filterType === 'language') {
      cy.get('input[placeholder*="언어"]')
        .clear()
        .type(value as string);
    }
    cy.get('button').contains('적용').click();
  }
);

export {};
