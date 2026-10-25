describe('plain-resume', () => {
  beforeEach(() => cy.visit('/'));

  it('Should filter list', () => {
    cy.get('[data-role="project"]').then((listing) => {
      const currentCount = listing.length;
      cy.get('[data-role="keyword-filter"]').first().click();

      cy.get('[data-role="project"]').should('have.length.lessThan', currentCount);

      cy.get('[data-role="keyword-filter"]').first().click();

      cy.get('[data-role="project"]').should('have.length', currentCount);
    });
  });
});
