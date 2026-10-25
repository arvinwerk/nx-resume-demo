import { plainText } from './portfolio-catalog';
import {
  AUDIENCES,
  Audience,
  DETAIL_LEVELS,
  DetailLevel,
  PORTFOLIO_LAYOUTS,
  PortfolioAIResponse,
  PortfolioAction,
  PortfolioCatalog,
  PortfolioLayout,
  isRecord,
} from './portfolio.types';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_ACTIONS = 8;
const MAX_LIST_LENGTH = 12;
const MAX_SUGGESTIONS = 3;
const MAX_SUGGESTION_LENGTH = 160;

export type ParseResult =
  | { ok: true; value: PortfolioAIResponse }
  | { ok: false; error: string };

export function parsePortfolioAIResponse(
  input: unknown,
  catalog: PortfolioCatalog
): ParseResult {
  if (!isRecord(input)) {
    return { ok: false, error: 'Response must be an object' };
  }

  const message = cleanMessage(input['message']);
  if (!message) {
    return { ok: false, error: 'Response message is missing' };
  }

  const actions = parseActions(input['actions'], catalog);
  const suggestedQuestions = parseSuggestions(input['suggestedQuestions']);
  const value: PortfolioAIResponse = suggestedQuestions.length
    ? { message, actions, suggestedQuestions }
    : { message, actions };

  return { ok: true, value };
}

export function canonicalValues(
  values: readonly string[],
  allowed: readonly string[]
): string[] {
  const byLower = new Map(allowed.map((value) => [value.toLowerCase(), value]));
  const result: string[] = [];

  for (const value of values) {
    const match = byLower.get(value.trim().toLowerCase());
    if (match && !result.includes(match)) {
      result.push(match);
    }
  }

  return result;
}

export function canonicalTags(
  values: readonly string[],
  catalog: PortfolioCatalog
): string[] {
  return canonicalValues(values, [...catalog.skills, ...catalog.companies]);
}

function parseActions(input: unknown, catalog: PortfolioCatalog): PortfolioAction[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const actions: PortfolioAction[] = [];
  for (const candidate of input) {
    if (actions.length >= MAX_ACTIONS) {
      break;
    }
    const action = parseAction(candidate, catalog);
    if (action) {
      actions.push(action);
    }
  }
  return actions;
}

function parseAction(input: unknown, catalog: PortfolioCatalog): PortfolioAction | null {
  if (!isRecord(input) || typeof input['type'] !== 'string') {
    return null;
  }

  switch (input['type']) {
    case 'setAudience':
      return parseAudience(input['value']);
    case 'setDetailLevel':
      return parseDetail(input['value']);
    case 'setLayout':
      return parseLayout(input['value']);
    case 'filterProjects':
      return parseTagAction('filterProjects', input['tags'], catalog);
    case 'highlightSkills':
      return parseSkillAction(input['skills'], catalog);
    case 'resetPortfolio':
      return { type: 'resetPortfolio' };
    default:
      return null;
  }
}

function parseAudience(value: unknown): PortfolioAction | null {
  const audience = enumValue(value, AUDIENCES);
  return audience ? { type: 'setAudience', value: audience } : null;
}

function parseDetail(value: unknown): PortfolioAction | null {
  const detail = enumValue(value, DETAIL_LEVELS);
  return detail ? { type: 'setDetailLevel', value: detail } : null;
}

function parseLayout(value: unknown): PortfolioAction | null {
  const layout = enumValue(value, PORTFOLIO_LAYOUTS);
  return layout ? { type: 'setLayout', value: layout } : null;
}

function parseTagAction(
  type: 'filterProjects',
  input: unknown,
  catalog: PortfolioCatalog
): PortfolioAction | null {
  const list = parseStringList(input);
  if (!list) {
    return null;
  }

  const tags = canonicalTags(list.values, catalog).slice(0, MAX_LIST_LENGTH);
  if (list.values.length > 0 && tags.length === 0) {
    return null;
  }

  return { type, tags };
}

function parseSkillAction(input: unknown, catalog: PortfolioCatalog): PortfolioAction | null {
  const list = parseStringList(input);
  if (!list) {
    return null;
  }

  const skills = canonicalValues(list.values, catalog.skills).slice(0, MAX_LIST_LENGTH);
  if (list.values.length > 0 && skills.length === 0) {
    return null;
  }

  return { type: 'highlightSkills', skills };
}

function parseStringList(
  input: unknown
): { values: string[] } | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const values: string[] = [];
  for (const item of input) {
    if (typeof item === 'string' && item.trim()) {
      values.push(item.trim());
    }
  }

  if (input.length > 0 && values.length === 0) {
    return null;
  }

  return { values };
}

function parseSuggestions(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const suggestions: string[] = [];
  for (const item of input) {
    if (typeof item !== 'string') {
      continue;
    }
    const question = plainText(item);
    if (question.length < 3 || question.length > MAX_SUGGESTION_LENGTH) {
      continue;
    }
    if (suggestions.some((existing) => existing.toLowerCase() === question.toLowerCase())) {
      continue;
    }
    suggestions.push(question);
    if (suggestions.length >= MAX_SUGGESTIONS) {
      break;
    }
  }
  return suggestions;
}

function cleanMessage(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  const message = plainText(input);
  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  return message;
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = allowed.find((item) => item.toLowerCase() === value.trim().toLowerCase());
  return match ?? null;
}

export function isAudience(value: string): value is Audience {
  return (AUDIENCES as readonly string[]).includes(value);
}

export function isDetailLevel(value: string): value is DetailLevel {
  return (DETAIL_LEVELS as readonly string[]).includes(value);
}

export function isPortfolioLayout(value: string): value is PortfolioLayout {
  return (PORTFOLIO_LAYOUTS as readonly string[]).includes(value);
}
