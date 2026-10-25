import { extractAssistantJson, HttpPortfolioLanguageModel, parseJsonObject } from './portfolio-language-model';

describe('portfolio language model', () => {
  it('parses fenced JSON and JSON wrapped in prose', () => {
    expect(parseJsonObject('```json\n{"message":"Hi","actions":[]}\n```')).toEqual({
      message: 'Hi',
      actions: [],
    });
    expect(parseJsonObject('Sure. {"message":"Hi","actions":[]}')).toEqual({
      message: 'Hi',
      actions: [],
    });
  });

  it('reads a chat-completions payload', () => {
    expect(
      extractAssistantJson({
        choices: [{ message: { content: '{"message":"Hi","actions":[]}' } }],
      })
    ).toEqual({ message: 'Hi', actions: [] });
  });

  it('posts the conversation and surfaces HTTP failures without the response body', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn(),
    });
    const model = new HttpPortfolioLanguageModel(
      { endpoint: '/api/portfolio-ai', model: 'gpt-4o-mini', apiKey: 'secret' },
      fetchImpl
    );

    await expect(model.complete('system', [{ role: 'user', content: 'Hello' }])).rejects.toThrow(
      'Portfolio model request failed (401)'
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/portfolio-ai',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      })
    );
    const body = JSON.parse(String(fetchImpl.mock.calls[0][1].body));
    expect(body.messages[0]).toEqual({ role: 'system', content: 'system' });
    expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' });
  });
});
