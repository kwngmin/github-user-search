describe('GitHub User Search - Example', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('페이지가 정상적으로 로드된다', () => {
    cy.contains('GitHub User Search').should('exist');
  });

  it('검색 입력창이 존재한다', () => {
    cy.get('input[type="text"]').should('exist');
  });
});
