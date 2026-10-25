import { PortfolioProfile } from '@nx-resume/state';

export const PORTFOLIO_PROFILE: PortfolioProfile = {
  name: 'Arvin Sokarijo',
  role: 'Full-stack developer',
  summary:
    'I build web and mobile products across the stack: Angular and Ionic interfaces, and Laravel, PHP, Node.js and C# services. The work here covers event ticketing and seating, internal platforms, and operational integrations.',
  aiBoundary:
    'The project list does not include a shipped AI product. The AI work I can show is this portfolio: a question selects from a fixed set of layout, filter and emphasis actions, and the page changes only through those actions.',
  workingStyle: [
    'Small functions with predictable outputs, so the behaviour can be tested.',
    'Declarative updates instead of scattered mutation.',
    'Signals for interface state.',
    'Jest and end-to-end tests around the behaviour that matters.',
  ],
};
