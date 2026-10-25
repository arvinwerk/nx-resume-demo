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
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Portfolio model request failed (${response.status})`);
      }

      return extractAssistantJson(await response.json());
    } finally {
      clearTimeout(timer);
    }
  }
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
