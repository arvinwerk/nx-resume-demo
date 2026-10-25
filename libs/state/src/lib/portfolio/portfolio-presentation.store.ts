import { Injectable, computed, signal } from '@angular/core';
import {
  adaptationSummary,
  applyPortfolioActions,
  isInitialPresentation,
  sectionsFor,
} from './portfolio-reducer';
import {
  INITIAL_PRESENTATION,
  PortfolioAction,
  PortfolioCatalog,
  PresentationState,
} from './portfolio.types';

@Injectable({ providedIn: 'root' })
export class PortfolioPresentationStore {
  private readonly state = signal<PresentationState>({ ...INITIAL_PRESENTATION });

  readonly audience = computed(() => this.state().audience);
  readonly detailLevel = computed(() => this.state().detailLevel);
  readonly layout = computed(() => this.state().layout);
  readonly projectTags = computed(() => this.state().projectTags);
  readonly highlightedSkills = computed(() => this.state().highlightedSkills);
  readonly sections = computed(() => sectionsFor(this.state().layout));
  readonly summary = computed(() => adaptationSummary(this.state()));
  readonly customized = computed(() => !isInitialPresentation(this.state()));

  apply(actions: readonly PortfolioAction[], catalog: PortfolioCatalog): PresentationState {
    if (actions.length === 0) {
      return this.state();
    }

    const next = applyPortfolioActions(this.state(), actions, catalog);
    this.state.set(next);
    return next;
  }

  setProjectTags(tags: readonly string[]): void {
    const current = this.state();
    this.state.set({ ...current, projectTags: [...tags] });
  }
}
