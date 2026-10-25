import { InjectionToken } from '@angular/core';
import { ChatTurn, isRecord } from '@nx-resume/state';
import { environment } from '../../environments/environment';

export interface PortfolioAiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface PortfolioLanguageModel {
  configured(): boolean;
  complete(systemPrompt: string, history: readonly ChatTurn[]): Promise<unknown>;
}

export const PORTFOLIO_LANGUAGE_MODEL = new InjectionToken<PortfolioLanguageModel>(
  'PORTFOLIO_LANGUAGE_MODEL',
  {
    providedIn: 'root',
    factory: () => new HttpPortfolioLanguageModel(environment.portfolioAi),
  }
);

export class HttpPortfolioLanguageModel implements PortfolioLanguageModel {
  constructor(
    private readonly config: PortfolioAiConfig,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  configured(): boolean {
    return this.config.apiKey.trim().length > 0 && this.config.endpoint.trim().length > 0;
  }

  async complete(systemPrompt: string, history: readonly ChatTurn[]): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await this.fetchImpl(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.3,
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((turn) => ({ role: turn.role, content: turn.content })),
          ],
          tools: PORTFOLIO_TOOLS,
          tool_choice: 'auto',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Portfolio model request failed (${response.status})`);
      }

      return interpretModelPayload(await response.json());
    } finally {
      clearTimeout(timer);
    }
  }
}

const PORTFOLIO_TOOLS = [
  tool('setAudience', 'Choose who the portfolio is addressing.', {
    value: { type: 'string', enum: ['recruiter', 'manager', 'developer'] },
  }, ['value']),
  tool('filterProjects', 'Show projects whose skill or organisation matches the tags. Pass an empty list to show every project.', {
    tags: { type: 'array', items: { type: 'string' } },
  }, ['tags']),
  tool('highlightSkills', 'Emphasize catalog skills. Pass an empty list to clear the emphasis.', {
    skills: { type: 'array', items: { type: 'string' } },
  }, ['skills']),
  tool('setDetailLevel', 'Show the short project text or the longer notes.', {
    value: { type: 'string', enum: ['overview', 'detailed'] },
  }, ['value']),
  tool('setLayout', 'Reorder the existing sections. default, projects, impact, or technical.', {
    value: { type: 'string', enum: ['default', 'projects', 'impact', 'technical'] },
  }, ['value']),
  tool('resetPortfolio', 'Restore the original section order, filters, and emphasis.', {}, []),
  tool('suggestQuestions', 'Offer two or three short follow-up questions the catalog can answer.', {
    questions: { type: 'array', items: { type: 'string' } },
  }, ['questions']),
];

function tool(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required: string[]
) {
  return {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      },
    },
  };
}

export function interpretModelPayload(payload: unknown): unknown {
  const fromTools = responseFromToolCalls(payload);
  return fromTools ?? extractAssistantJson(payload);
}

export function extractAssistantJson(payload: unknown): unknown {
  if (isRecord(payload) && typeof payload['message'] === 'string') {
    return payload;
  }

  if (!isRecord(payload) || !Array.isArray(payload['choices']) || payload['choices'].length === 0) {
    throw new Error('Portfolio model returned no choices');
  }

  const choice = payload['choices'][0];
  if (!isRecord(choice)) {
    throw new Error('Portfolio model returned no message');
  }

  const message = choice['message'];
  if (!isRecord(message) || typeof message['content'] !== 'string') {
    throw new Error('Portfolio model returned no message');
  }

  return parseJsonObject(message['content']);
}

export function parseJsonObject(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error('Portfolio model did not return JSON');
  }
}

function responseFromToolCalls(payload: unknown): Record<string, unknown> | null {
  const message = assistantMessage(payload);
  if (!message || !Array.isArray(message['tool_calls']) || message['tool_calls'].length === 0) {
    return null;
  }

  const actions: Record<string, unknown>[] = [];
  const suggestedQuestions: string[] = [];
  for (const call of message['tool_calls']) {
    if (!isRecord(call)) {
      continue;
    }
    const fn = isRecord(call['function']) ? call['function'] : call;
    const name = typeof fn['name'] === 'string' ? fn['name'] : '';
    const args = readArguments(fn['arguments']);
    if (name === 'suggestQuestions') {
      appendStrings(args['questions'], suggestedQuestions);
      continue;
    }
    const action = actionFromTool(name, args);
    if (action) {
      actions.push(action);
    }
  }

  const content = readContent(message['content'], suggestedQuestions);
  const result: Record<string, unknown> = {
    message: content.message || 'I updated the portfolio to match that.',
    actions: actions.length > 0 ? actions : content.actions,
  };
  if (suggestedQuestions.length > 0) {
    result['suggestedQuestions'] = suggestedQuestions;
  }
  return result;
}

function assistantMessage(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload) || !Array.isArray(payload['choices']) || payload['choices'].length === 0) {
    return null;
  }
  const choice = payload['choices'][0];
  if (!isRecord(choice) || !isRecord(choice['message'])) {
    return null;
  }
  return choice['message'];
}

function actionFromTool(name: string, args: Record<string, unknown>): Record<string, unknown> | null {
  switch (name) {
    case 'setAudience':
    case 'setDetailLevel':
    case 'setLayout':
      return { type: name, value: args['value'] };
    case 'filterProjects':
      return { type: name, tags: Array.isArray(args['tags']) ? args['tags'] : [] };
    case 'highlightSkills':
      return { type: name, skills: Array.isArray(args['skills']) ? args['skills'] : [] };
    case 'resetPortfolio':
      return { type: 'resetPortfolio' };
    default:
      return null;
  }
}

function readArguments(value: unknown): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function readContent(
  content: unknown,
  suggestedQuestions: string[]
): { message: string; actions: unknown[] } {
  if (typeof content !== 'string' || content.trim().length === 0) {
    return { message: '', actions: [] };
  }
  const trimmed = content.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('```')) {
    return { message: trimmed, actions: [] };
  }
  try {
    const parsed = parseJsonObject(trimmed);
    if (!isRecord(parsed)) {
      return { message: trimmed, actions: [] };
    }
    if (suggestedQuestions.length === 0) {
      appendStrings(parsed['suggestedQuestions'], suggestedQuestions);
    }
    return {
      message: typeof parsed['message'] === 'string' ? parsed['message'] : trimmed,
      actions: Array.isArray(parsed['actions']) ? parsed['actions'] : [],
    };
  } catch {
    return { message: trimmed, actions: [] };
  }
}

function appendStrings(value: unknown, target: string[]): void {
  if (!Array.isArray(value)) {
    return;
  }
  for (const item of value) {
    if (typeof item === 'string') {
      target.push(item);
    }
  }
}
