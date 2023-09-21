import { Injectable, Signal, computed, effect, inject, signal } from "@angular/core";
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
      return projects.filter((p) => {
        return p.keywords.some((keyword) => keywords.includes(keyword))
      })
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

  public setProducts(products: ProjectModel[]) {
    this.state.$projects.set(products);
  }

  public toggleSelection(keyword: string) {
    const keywords = this.state.$selectedKeywords();
    const found = keywords.some((k) => k === keyword);

    if (found) {
      this.state.$selectedKeywords
      .set(keywords.filter((k) => k !== keyword));
    } else {
      keywords.push(keyword);
      this.state.$selectedKeywords.set(keywords);
    }
  }
}
