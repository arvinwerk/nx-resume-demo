import { buildCatalog } from './portfolio-catalog';
import { buildPortfolioSystemPrompt } from './portfolio-prompt';
import { portfolioQuestionNeedsModel, reasonOffline } from './portfolio-reasoner';
import { parsePortfolioAIResponse } from './portfolio-validation';
import { OPENING_QUESTIONS, PortfolioProfile } from './portfolio.types';

const profile: PortfolioProfile = {
  name: 'Arvin Sokarijo',
  role: 'Full-stack developer',
  summary: 'Builds web and mobile products.',
  aiBoundary: 'The project list does not include a shipped AI product.',
  workingStyle: ['Signals for interface state.'],
};

const catalog = buildCatalog(profile, [
  {
    id: 1,
    company: 'We-Invite',
    title: 'Vrienden van Amstel VIP 2024',
    shortDescription: 'Web shop and admin.',
    longDescription: null,
    keywords: ['Laravel', 'Angular'],
    images: [],
  },
  {
    id: 2,
    company: 'Ziggo',
    title: 'Microservice / middleware',
    shortDescription: 'Outage data for ziggo.nl.',
    longDescription: 'Debugged the Node.js middleware.',
    keywords: ['NodeJS'],
    images: [],
  },
  {
    id: 3,
    company: 'Sanoma',
    title: 'Swipe & Shop app',
    shortDescription: 'Tinder for fashion.',
    longDescription: 'Backend work involving Heroku, Docker and AWS S3.',
    keywords: ['PHP', 'AWS'],
    images: [],
  },
]);

function ask(question: string) {
  const raw = reasonOffline([{ role: 'user', content: question }], catalog);
  const parsed = parsePortfolioAIResponse(raw, catalog);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  return parsed.value;
}

describe('reasonOffline', () => {
  it.each(OPENING_QUESTIONS)('answers "%s" through the shared contract', (question) => {
    const response = ask(question);
    expect(response.message.length).toBeGreaterThan(20);
    expect(response.actions.length).toBeGreaterThan(0);
    expect(response.suggestedQuestions?.some((item) => item.toLowerCase() === question.toLowerCase())).toBe(false);
  });

  it('turns an organisation question into an impact view', () => {
    const response = ask('What can you bring to my organization?');
    expect(response.actions).toEqual(
      expect.arrayContaining([
        { type: 'setAudience', value: 'manager' },
        { type: 'setLayout', value: 'impact' },
        { type: 'setDetailLevel', value: 'overview' },
      ])
    );
    expect(response.message).toContain('Vrienden van Amstel VIP 2024');
    expect(response.message).toContain("won't invent");
  });

  it('lists built work without hiding the project section', () => {
    const response = ask('What have you built?');
    expect(response.actions).toEqual(
      expect.arrayContaining([
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'detailed' },
      ])
    );
    expect(response.message).toContain('Microservice / middleware');
  });

  it('does not invent an AI product', () => {
    const response = ask('What do you do with AI?');
    expect(response.message).toContain(profile.aiBoundary);
    expect(response.message).not.toMatch(/shipped (an|a) (model|chatbot|llm)/i);
    expect(response.actions.some((action) => action.type === 'filterProjects')).toBe(false);
    expect(response.actions).toEqual(
      expect.arrayContaining([{ type: 'setLayout', value: 'technical' }])
    );
  });

  it('filters a named skill from a free-text question', () => {
    const response = ask('Show me the Node.js work');
    expect(response.actions).toEqual(
      expect.arrayContaining([
        { type: 'filterProjects', tags: ['NodeJS'] },
        { type: 'highlightSkills', skills: ['NodeJS'] },
      ])
    );
    expect(response.message).toContain('Microservice / middleware');
  });

  it('filters by organisation without inventing a new action', () => {
    const response = ask('Tell me about the Ziggo work');
    expect(response.actions).toEqual(
      expect.arrayContaining([{ type: 'filterProjects', tags: ['Ziggo'] }])
    );
    expect(response.message).toContain('ziggo.nl');
  });

  it('refuses employers and skills that are not in the catalog', () => {
    const employer = ask('Did you work at Google?');
    expect(employer.actions).toEqual([]);
    expect(employer.message).toContain('Nothing here is about that other organisation');
    expect(employer.message).not.toMatch(/I worked at Google/i);

    const skill = ask('Show me the Rust work');
    expect(skill.actions).toEqual([]);
    expect(skill.message).toContain('Nothing in the portfolio is tagged "Rust"');
  });

  it('does not invent business metrics, and can count catalog projects', () => {
    const revenue = ask('What revenue did Ziggo generate?');
    expect(revenue.message).toContain('not in the portfolio');
    expect(revenue.message).not.toMatch(/€|\$|%|million/i);

    const count = ask('How many projects use Laravel?');
    expect(count.message).toContain('1 project');
    expect(count.actions).toEqual(
      expect.arrayContaining([{ type: 'filterProjects', tags: ['Laravel'] }])
    );
  });

  it('answers Dutch questions in Dutch and resets on request', () => {
    const built = ask('Wat heb je gebouwd?');
    expect(built.message).toContain('Dit is het werk');
    expect(built.actions).toEqual(expect.arrayContaining([{ type: 'setLayout', value: 'projects' }]));

    const reset = ask('Please reset the portfolio');
    expect(reset.actions).toEqual([{ type: 'resetPortfolio' }]);
  });

  it('leaves the page alone for a greeting', () => {
    expect(ask('Hello there').actions).toEqual([]);
  });

  it('clears a filter without treating an English project name as Dutch', () => {
    const cleared = ask('Show every project again');
    expect(cleared.actions).toEqual([{ type: 'filterProjects', tags: [] }]);
    expect(cleared.message).toBe('Showing every project again.');

    const named = ask('Tell me about Vrienden van Amstel');
    expect(named.message).toContain('Vrienden van Amstel VIP 2024');
    expect(named.message).not.toContain('Dit is het werk');
    expect(named.actions).toEqual(
      expect.arrayContaining([{ type: 'filterProjects', tags: ['We-Invite'] }])
    );
  });
});

describe('portfolioQuestionNeedsModel', () => {
  it('keeps catalog questions local and sends open questions to the model', () => {
    const history = (question: string) => [{ role: 'user' as const, content: question }];
    expect(portfolioQuestionNeedsModel(history('What have you built?'), catalog)).toBe(false);
    expect(portfolioQuestionNeedsModel(history('Show me the Laravel work'), catalog)).toBe(false);
    expect(portfolioQuestionNeedsModel(history('Hello'), catalog)).toBe(true);
    expect(portfolioQuestionNeedsModel(history('What should I notice first?'), catalog)).toBe(true);
  });
});

describe('buildPortfolioSystemPrompt', () => {
  it('grounds the model in the catalog and the closed action set', () => {
    const prompt = buildPortfolioSystemPrompt(catalog);
    expect(prompt).toContain('Vrienden van Amstel VIP 2024');
    expect(prompt).toContain('resetPortfolio');
    expect(prompt).toContain('setLayout');
    expect(prompt).toContain('Never invent');
    expect(prompt).toContain(profile.aiBoundary);
    expect(prompt).toContain('Docker');
    expect(prompt).not.toContain('<script');
  });
});
