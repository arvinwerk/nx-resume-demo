import { Component, OnInit, Signal, inject } from '@angular/core';
import { AppStore } from '@nx-resume/state';
import { ProjectModel, ProjectService } from '@nx-resume/projects';
import { take } from 'rxjs';
import { OptionModel } from '@nx-resume/projects';

@Component({
  selector: 'nx-resume-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  appStore: AppStore;
  projects$: Signal<ProjectModel[]>;
  projectService: ProjectService;
  keywordOptions$: Signal<OptionModel[]>;

  constructor() {
    this.appStore = inject(AppStore);
    this.projectService = inject(ProjectService);
    this.projects$ = this.appStore.filteredProjects$;
    this.keywordOptions$ = this.appStore.projectKeywords$;
  }

  ngOnInit() {
    this.projectService.getProjects().pipe(take(1)).subscribe((projects) => {
      this.appStore.setProducts(projects);
    })
  }

  updateKeywordSelections($event: OptionModel) {
    this.appStore.toggleSelection($event.key);
  }
}
