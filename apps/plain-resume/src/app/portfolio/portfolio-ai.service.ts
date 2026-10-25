import { Inject, Injectable } from '@angular/core';
import {
  ChatTurn,
  OPENING_QUESTIONS,
  PortfolioAIResponse,
  PortfolioCatalog,
  buildPortfolioSystemPrompt,
  parsePortfolioAIResponse,
  reasonOffline,
} from '@nx-resume/state';
import { PORTFOLIO_LANGUAGE_MODEL, PortfolioLanguageModel } from './portfolio-language-model';

@Injectable({ providedIn: 'root' })
export class PortfolioAiService {
  constructor(
    @Inject(PORTFOLIO_LANGUAGE_MODEL) private readonly model: PortfolioLanguageModel
  ) {}

  async ask(history: readonly ChatTurn[], catalog: PortfolioCatalog): Promise<PortfolioAIResponse> {
    if (this.model.configured()) {
      try {
        const raw = await this.model.complete(buildPortfolioSystemPrompt(catalog), history);
        const parsed = parsePortfolioAIResponse(raw, catalog);
        if (parsed.ok) {
          return parsed.value;
        }
        return safeFailure(
          'I could not apply that response safely. Ask about a project, a skill, or the work itself.'
        );
      } catch {
        return safeFailure(
          'I cannot reach the model right now. The projects and filters below still work.'
        );
      }
    }

    const parsed = parsePortfolioAIResponse(reasonOffline(history, catalog), catalog);
    if (!parsed.ok) {
      return safeFailure('I could not answer that from the portfolio. Try one of the questions below.');
    }
    return parsed.value;
  }
}

function safeFailure(message: string): PortfolioAIResponse {
  return {
    message,
    actions: [],
    suggestedQuestions: [...OPENING_QUESTIONS].slice(0, 3),
  };
}
