import { Injectable, Signal, computed, signal } from "@angular/core";
import { OptionModel, ProjectModel } from "@nx-resume/projects";

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly state = {
    $projects: signal<ProjectModel[]>([]),
    $selectedKeywords: signal<string[]>([]),
  } as const;
  
  public get filteredProjects$() {
    return computed(() => {
      const keywords = this.state.$selectedKeywords();
      const projects = this.state.$projects();
      if (keywords.length === 0) {
        return projects;
      }
      return projects.filter((project) =>
        keywords.some(
          (keyword) =>
            project.keywords.includes(keyword) || project.company === keyword
        )
      );
    });
  }

  public get projectKeywords$(): Signal<OptionModel[]> {
    return computed(() => {
      const projects = this.state.$projects();
      const selectedKeywords = this.state.$selectedKeywords();
      const keywords = projects.map((p) => p.keywords).flat();

      return keywords
      .filter((item,
        index) => keywords.indexOf(item) === index)
        .map((keyword) => {
          return ({
            key: keyword,
            selected: selectedKeywords.indexOf(keyword) > -1
          })
        });

      });
  }

  public allProjects(): ProjectModel[] {
    return this.state.$projects();
  }

  public selectedKeywords(): string[] {
    return this.state.$selectedKeywords();
  }

  public setProducts(products: ProjectModel[]) {
    this.state.$projects.set(products);
  }

  public setSelectedKeywords(keywords: readonly string[]) {
    this.state.$selectedKeywords.set([...keywords]);
  }

  public toggleSelection(keyword: string) {
    const keywords = this.state.$selectedKeywords();
    const found = keywords.some((item) => item === keyword);
    const next = found
      ? keywords.filter((item) => item !== keyword)
      : [...keywords, keyword];
    this.state.$selectedKeywords.set(next);
  }
}
