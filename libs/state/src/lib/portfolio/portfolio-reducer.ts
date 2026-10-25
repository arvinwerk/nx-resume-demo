import { canonicalTags, canonicalValues } from './portfolio-validation';
import {
  INITIAL_PRESENTATION,
  PortfolioAction,
  PortfolioCatalog,
  PortfolioLayout,
  PortfolioSectionId,
  PresentationState,
} from './portfolio.types';

export function sectionsFor(layout: PortfolioLayout): PortfolioSectionId[] {
  switch (layout) {
    case 'projects':
      return ['intro', 'projects', 'skills'];
    case 'impact':
      return ['intro', 'experience', 'skills'];
    case 'technical':
      return ['intro', 'skills', 'projects'];
    default:
      return ['intro', 'skills', 'projects'];
  }
}

export function isInitialPresentation(state: PresentationState): boolean {
  return (
    state.audience === null &&
    state.detailLevel === INITIAL_PRESENTATION.detailLevel &&
    state.layout === INITIAL_PRESENTATION.layout &&
    state.projectTags.length === 0 &&
    state.highlightedSkills.length === 0
  );
}

export function adaptationSummary(state: PresentationState): string | null {
  if (isInitialPresentation(state)) {
    return null;
  }

  const parts: string[] = [];
  if (state.layout !== 'default') {
    parts.push(`${state.layout} layout`);
  }
  if (state.audience) {
    parts.push(`${state.audience} view`);
  }
  if (state.detailLevel === 'overview') {
    parts.push('shorter detail');
  }
  if (state.projectTags.length > 0) {
    parts.push(joinList(state.projectTags));
  }
  if (state.highlightedSkills.length > 0) {
    parts.push(`highlighting ${joinList(state.highlightedSkills)}`);
  }

  return parts.length > 0 ? `View · ${parts.join(' · ')}` : null;
}

export function audienceLead(audience: PresentationState['audience']): string {
  switch (audience) {
    case 'recruiter':
      return 'A direct look at shipped work and the stacks behind it.';
    case 'manager':
      return 'Focused on operational outcomes: events, internal tools, and integrations.';
    case 'developer':
      return 'Focused on implementation: frameworks, services, and how this interface is put together.';
    default:
      return 'Ask a question and this page reorganizes around the answer. The projects stay available either way.';
  }
}

export function applyPortfolioActions(
  state: PresentationState,
  actions: readonly PortfolioAction[],
  catalog: PortfolioCatalog
): PresentationState {
  return actions.reduce(
    (current, action) => applyPortfolioAction(current, action, catalog),
    state
  );
}

function applyPortfolioAction(
  state: PresentationState,
  action: PortfolioAction,
  catalog: PortfolioCatalog
): PresentationState {
  switch (action.type) {
    case 'resetPortfolio':
      return {
        audience: null,
        detailLevel: 'detailed',
        layout: 'default',
        projectTags: [],
        highlightedSkills: [],
      };
    case 'setAudience':
      return { ...state, audience: action.value };
    case 'setDetailLevel':
      return { ...state, detailLevel: action.value };
    case 'setLayout':
      return { ...state, layout: action.value };
    case 'filterProjects':
      return {
        ...state,
        projectTags: retainOrKeep(action.tags, canonicalTags(action.tags, catalog), state.projectTags),
      };
    case 'highlightSkills':
      return {
        ...state,
        highlightedSkills: retainOrKeep(
          action.skills,
          canonicalValues(action.skills, catalog.skills),
          state.highlightedSkills
        ),
      };
    default:
      return state;
  }
}

function retainOrKeep(
  requested: readonly string[],
  valid: readonly string[],
  previous: readonly string[]
): readonly string[] {
  if (requested.length > 0 && valid.length === 0) {
    return previous;
  }
  return [...valid];
}

function joinList(values: readonly string[]): string {
  if (values.length <= 4) {
    return values.join(', ');
  }
  return `${values.slice(0, 4).join(', ')} +${values.length - 4}`;
}
