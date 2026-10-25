import { PortfolioCatalog } from './portfolio.types';
import { parsePortfolioAIResponse } from './portfolio-validation';

const catalog: PortfolioCatalog = {
  profile: {
    name: 'Arvin Sokarijo',
    role: 'Full-stack developer',
    summary: 'Builds products.',
    aiBoundary: 'No shipped AI product is listed.',
    workingStyle: ['Signals for state'],
  },
  projects: [],
  skills: ['Angular', 'Laravel'],
  companies: ['Ziggo', 'We-Invite'],
};

describe('parsePortfolioAIResponse', () => {
  it('keeps a valid response and canonicalizes values', () => {
    const parsed = parsePortfolioAIResponse(
      {
        message: '  Here is the Angular work. ',
        actions: [
          { type: 'setLayout', value: 'PROJECTS' },
          { type: 'filterProjects', tags: ['laravel', 'Ziggo'] },
          { type: 'highlightSkills', skills: ['angular'] },
        ],
        suggestedQuestions: [' What have you built? ', 'What have you built?'],
      },
      catalog
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.message).toBe('Here is the Angular work.');
    expect(parsed.value.actions).toEqual([
      { type: 'setLayout', value: 'projects' },
      { type: 'filterProjects', tags: ['Laravel', 'Ziggo'] },
      { type: 'highlightSkills', skills: ['Angular'] },
    ]);
    expect(parsed.value.suggestedQuestions).toEqual(['What have you built?']);
  });

  it('drops unsupported actions without rejecting the message', () => {
    const parsed = parsePortfolioAIResponse(
      {
        message: 'Still a useful answer.',
        actions: [
          { type: 'setLayout', value: 'impact' },
          { type: 'renderHtml', html: '<script>alert(1)</script>' },
          { type: 'setAudience', value: 'ceo' },
          { type: 'highlightSkills', skills: ['Rust', 'Angular'] },
          { type: 'filterProjects', tags: ['NotARealSkill'] },
        ],
      },
      catalog
    );

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(parsed.value.actions).toEqual([
      { type: 'setLayout', value: 'impact' },
      { type: 'highlightSkills', skills: ['Angular'] },
    ]);
  });

  it('rejects a response that has no usable message', () => {
    expect(parsePortfolioAIResponse(['nope'], catalog).ok).toBe(false);
    expect(parsePortfolioAIResponse({ actions: [] }, catalog).ok).toBe(false);
    expect(parsePortfolioAIResponse({ message: '<img src=x onerror=alert(1)>', actions: [] }, catalog).ok).toBe(false);
  });

  it('treats a missing or invalid action list as no actions', () => {
    const parsed = parsePortfolioAIResponse({ message: 'Hello', actions: 'nope' }, catalog);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.actions).toEqual([]);
    }
  });

  it('allows an empty tag list to clear a filter', () => {
    const parsed = parsePortfolioAIResponse(
      { message: 'Showing everything.', actions: [{ type: 'filterProjects', tags: [] }] },
      catalog
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.value.actions).toEqual([{ type: 'filterProjects', tags: [] }]);
    }
  });
});
