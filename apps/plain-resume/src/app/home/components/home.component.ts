import { Component, OnInit, Signal, computed, inject } from '@angular/core';
import { ProjectModel, ProjectService, OptionModel } from '@nx-resume/projects';
import {
  AppStore,
  CompanyGroup,
  PortfolioAction,
  PortfolioCatalog,
  PortfolioPresentationStore,
  PortfolioSectionId,
  audienceLead,
  buildCatalog,
  groupByCompany,
} from '@nx-resume/state';
import { take } from 'rxjs';
import { PORTFOLIO_PROFILE } from '../../portfolio/portfolio-profile';

@Component({
  selector: 'nx-resume-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  appStore: AppStore;
  presentation: PortfolioPresentationStore;
  projectService: ProjectService;
  projects$: Signal<ProjectModel[]>;
  keywordOptions$: Signal<OptionModel[]>;
  catalog: Signal<PortfolioCatalog>;
  groups: Signal<CompanyGroup[]>;
  lead: Signal<string>;

  constructor() {
    this.appStore = inject(AppStore);
    this.presentation = inject(PortfolioPresentationStore);
    this.projectService = inject(ProjectService);
    this.projects$ = this.appStore.filteredProjects$;
    this.keywordOptions$ = this.appStore.projectKeywords$;
    this.catalog = computed(() => buildCatalog(PORTFOLIO_PROFILE, this.appStore.allProjects()));
    this.groups = computed(() => groupByCompany(this.projects$()));
    this.lead = computed(() => audienceLead(this.presentation.audience()));
  }

  ngOnInit() {
    this.projectService.getProjects().pipe(take(1)).subscribe((projects) => {
      this.appStore.setProducts(projects);
    });
  }

  updateKeywordSelections(option: OptionModel) {
    this.appStore.toggleSelection(option.key);
    this.presentation.setProjectTags(this.appStore.selectedKeywords());
  }

  onPortfolioActions(actions: PortfolioAction[]) {
    if (actions.length === 0) {
      return;
    }

    const next = this.presentation.apply(actions, this.catalog());
    const changesFilter = actions.some(
      (action) => action.type === 'filterProjects' || action.type === 'resetPortfolio'
    );
    if (changesFilter) {
      this.appStore.setSelectedKeywords(next.projectTags);
    }
  }

  resetPortfolio() {
    this.onPortfolioActions([{ type: 'resetPortfolio' }]);
  }

  statusNotes(): string[] {
    const summary = this.presentation.summary();
    return summary ? [summary] : [];
  }

  trackSection(_index: number, section: PortfolioSectionId): string {
    return section;
  }

  trackNote(_index: number, note: string): string {
    return note;
  }

  trackCompany(_index: number, group: CompanyGroup): string {
    return group.company;
  }

  trackProject(_index: number, project: ProjectModel): number {
    return project.id;
  }
}
