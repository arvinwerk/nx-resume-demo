import { buildCatalog } from '@nx-resume/state';
import { PortfolioAiService } from './portfolio-ai.service';
import { PortfolioLanguageModel } from './portfolio-language-model';
import { PORTFOLIO_PROFILE } from './portfolio-profile';

const catalog = buildCatalog(PORTFOLIO_PROFILE, [
  {
    id: 1,
    company: 'We-Invite',
    title: 'Vrienden van Amstel VIP 2024',
    shortDescription: 'Web shop and admin.',
    longDescription: null,
    keywords: ['Laravel', 'Angular'],
    images: [],
  },
]);

describe('PortfolioAiService', () => {
  function service(model: PortfolioLanguageModel) {
    return new PortfolioAiService(model);
  }

  it('sends starters and free text through the catalog interpreter when no model is configured', async () => {
    const model: PortfolioLanguageModel = {
      configured: () => false,
      complete: jest.fn(),
    };
    const response = await service(model).ask(
      [{ role: 'user', content: 'What have you built?' }],
      catalog
    );

    expect(model.complete).not.toHaveBeenCalled();
    expect(response.source).toBe('catalog');
    expect(response.actions).toEqual(
      expect.arrayContaining([{ type: 'setLayout', value: 'projects' }])
    );
    expect(response.message).toContain('Vrienden van Amstel VIP 2024');
  });

  it('does not call the model for a question the catalog can answer', async () => {
    const model: PortfolioLanguageModel = {
      configured: () => true,
      complete: jest.fn(),
    };
    const response = await service(model).ask(
      [{ role: 'user', content: 'What can you bring to my organization?' }],
      catalog
    );

    expect(model.complete).not.toHaveBeenCalled();
    expect(response.source).toBe('catalog');
    expect(response.actions).toEqual(
      expect.arrayContaining([{ type: 'setLayout', value: 'impact' }])
    );
  });

  it('sends an open question to the model so it can change the layout with tools', async () => {
    const model: PortfolioLanguageModel = {
      configured: () => true,
      complete: jest.fn().mockResolvedValue({
        message: 'I would start with the technical view.',
        actions: [{ type: 'setLayout', value: 'technical' }, { type: 'setAudience', value: 'developer' }],
      }),
    };

    const response = await service(model).ask([{ role: 'user', content: 'Hello' }], catalog);
    expect(model.complete).toHaveBeenCalled();
    expect(response.source).toBe('model');
    expect(response.actions).toEqual([
      { type: 'setLayout', value: 'technical' },
      { type: 'setAudience', value: 'developer' },
    ]);
  });

  it('strips invalid remote actions and keeps the message', async () => {
    const model: PortfolioLanguageModel = {
      configured: () => true,
      complete: jest.fn().mockResolvedValue({
        message: 'Looking at <b>Angular</b>.',
        actions: [
          { type: 'setLayout', value: 'technical' },
          { type: 'eval', code: 'alert(1)' },
          { type: 'highlightSkills', skills: ['Angular', 'Rust'] },
        ],
        suggestedQuestions: ['What do you do with AI?'],
      }),
    };

    const response = await service(model).ask([{ role: 'user', content: 'Hello' }], catalog);
    expect(response.message).toBe('Looking at Angular.');
    expect(response.actions).toEqual([
      { type: 'setLayout', value: 'technical' },
      { type: 'highlightSkills', skills: ['Angular'] },
    ]);
  });

  it('leaves the portfolio unchanged when the model cannot be reached', async () => {
    const model: PortfolioLanguageModel = {
      configured: () => true,
      complete: jest.fn().mockRejectedValue(new Error('offline')),
    };
    const response = await service(model).ask([{ role: 'user', content: 'Hello' }], catalog);
    expect(response.actions).toEqual([]);
    expect(response.message).toContain('cannot reach the model');
  });
});
