import {
  extractAssistantJson,
  HttpPortfolioLanguageModel,
  interpretModelPayload,
  parseJsonObject,
} from './portfolio-language-model';

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
    expect(body.tool_choice).toBe('auto');
    expect(body.tools.map((item: { function: { name: string } }) => item.function.name)).toEqual(
      expect.arrayContaining(['setLayout', 'filterProjects', 'resetPortfolio'])
    );
  });

  it('turns layout tool calls into portfolio actions', () => {
    expect(
      interpretModelPayload({
        choices: [
          {
            message: {
              content: 'Here is the technical view.',
              tool_calls: [
                {
                  type: 'function',
                  function: { name: 'setLayout', arguments: '{"value":"technical"}' },
                },
                {
                  type: 'function',
                  function: { name: 'setAudience', arguments: '{"value":"developer"}' },
                },
                {
                  type: 'function',
                  function: {
                    name: 'suggestQuestions',
                    arguments: '{"questions":["What have you built?"]}',
                  },
                },
              ],
            },
          },
        ],
      })
    ).toEqual({
      message: 'Here is the technical view.',
      actions: [
        { type: 'setLayout', value: 'technical' },
        { type: 'setAudience', value: 'developer' },
      ],
      suggestedQuestions: ['What have you built?'],
    });
  });
});
