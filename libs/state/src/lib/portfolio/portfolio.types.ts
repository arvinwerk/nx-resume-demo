export type Audience = 'recruiter' | 'manager' | 'developer';

export type DetailLevel = 'overview' | 'detailed';

export type PortfolioLayout = 'default' | 'projects' | 'impact' | 'technical';

export type PortfolioSectionId = 'intro' | 'skills' | 'projects' | 'experience';

export type PortfolioAction =
  | { type: 'setAudience'; value: Audience }
  | { type: 'filterProjects'; tags: string[] }
  | { type: 'highlightSkills'; skills: string[] }
  | { type: 'setDetailLevel'; value: DetailLevel }
  | { type: 'setLayout'; value: PortfolioLayout }
  | { type: 'resetPortfolio' };

export interface PortfolioAIResponse {
  message: string;
  actions: PortfolioAction[];
  suggestedQuestions?: string[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface PortfolioProfile {
  name: string;
  role: string;
  summary: string;
  aiBoundary: string;
  workingStyle: readonly string[];
}

export interface CatalogProject {
  id: number;
  company: string;
  title: string;
  summary: string;
  detail: string;
  keywords: readonly string[];
}

export interface PortfolioCatalog {
  profile: PortfolioProfile;
  projects: readonly CatalogProject[];
  skills: readonly string[];
  companies: readonly string[];
}

export interface PresentationState {
  audience: Audience | null;
  detailLevel: DetailLevel;
  layout: PortfolioLayout;
  projectTags: readonly string[];
  highlightedSkills: readonly string[];
}

export const OPENING_QUESTIONS = [
  'What can you bring to my organization?',
  'What have you built?',
  'What do you do with AI?',
  'What kind of developer are you?',
] as const;

export const INITIAL_PRESENTATION: PresentationState = {
  audience: null,
  detailLevel: 'detailed',
  layout: 'default',
  projectTags: [],
  highlightedSkills: [],
};

export const AUDIENCES = ['recruiter', 'manager', 'developer'] as const;
export const DETAIL_LEVELS = ['overview', 'detailed'] as const;
export const PORTFOLIO_LAYOUTS = ['default', 'projects', 'impact', 'technical'] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
