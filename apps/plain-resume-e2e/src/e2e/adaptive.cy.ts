describe('adaptive portfolio', () => {
  beforeEach(() => cy.visit('/'));

  it('opens with a question and adapts the page from a starter', () => {
    cy.contains('What would you like to know about me?').should('be.visible');
    cy.get('[data-role="conversation-starter"]').should('have.length', 4);
    cy.get('[data-layout="default"]').should('exist');
    cy.get('[data-role="project"]').should('have.length.greaterThan', 0);

    cy.contains('button', 'What can you bring to my organization?').click();

    cy.contains('What can you bring to my organization?').should('be.visible');
    cy.get('[data-layout="impact"]').should('exist');
    cy.get('[data-section="experience"]').should('exist');
    cy.get('[data-section="projects"]').should('not.exist');
    cy.get('[role="status"]').should('contain', 'impact layout');

    cy.contains('button', 'Reset portfolio').click();

    cy.get('[data-layout="default"]').should('exist');
    cy.get('[data-section="projects"]').should('exist');
    cy.contains('button', 'Reset portfolio').should('not.exist');
  });

  it('keeps the question and the projects usable on a phone', () => {
    cy.viewport(390, 844);
    cy.visit('/');
    cy.contains('What would you like to know about me?').should('be.visible');
    cy.get('[data-role="conversation-starter"]').first().should('be.visible');
    cy.get('[data-role="project"]').first().scrollIntoView().should('be.visible');
    cy.contains('button', 'What have you built?').click();
    cy.get('[data-layout="projects"]').should('exist');
    cy.get('#portfolio-question').scrollIntoView().should('be.visible');
  });

  it('filters projects from a typed question', () => {
    cy.get('#portfolio-question').type('Show me the Laravel work{enter}');
    cy.get('[data-role="keyword-filter"]').contains('Laravel').should('have.class', 'is-selected');
    cy.get('[data-role="project"]').each(($project) => {
      cy.wrap($project).should('contain', 'Laravel');
    });
    cy.get('[data-layout="projects"]').should('exist');
  });
});
