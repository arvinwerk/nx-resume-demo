import { getGreeting } from '../support/app.po';

describe('plain-resume', () => {
  beforeEach(() => cy.visit('/'));

  it('Should filter list', () => {
    cy.get('nx-resume-projects')
      .find('> div > div')
      .then((listing) => {
        const currentCount = listing.length;
        cy.get('button').first().click();

        cy.get('nx-resume-projects')
          .find('> div > div')
          .then((listing) => {
            expect(listing.length).to.lessThan(currentCount);

            cy.get('button').first().click();

            cy.get('nx-resume-projects')
              .find('> div > div')
              .then((listing) => {
                expect(listing.length).to.equals(currentCount);
              });
          });
      });
  });
});
