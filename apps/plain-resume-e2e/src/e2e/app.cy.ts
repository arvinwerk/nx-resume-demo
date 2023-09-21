import { getGreeting } from '../support/app.po';

describe('plain-resume', () => {
  beforeEach(() => cy.visit('/'));

  it('Should filter list', () => {
    console.log(cy.get('nx-resume-projects').children());
    cy.get('nx-resume-projects')
  .find('> div > div')
  .then(listing => {
    console.log('listing', listing);
    console.log('listing L', listing.length);
    const currentCount = listing.length;
    cy.get('button').first().click();

    cy.get('nx-resume-projects')
  .find('> div > div')
  .then(listing => {
    expect(listing.length).to.lessThan(currentCount);
    listing.each((list) => {
      // expect(list).contains()
    })
  });
  });
  });
});
