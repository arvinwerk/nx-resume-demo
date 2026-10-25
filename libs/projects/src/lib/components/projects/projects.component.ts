import { Component, Input } from '@angular/core';
import { ProjectModel } from '../../models/project.model';

@Component({
  selector: 'nx-resume-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent {
  @Input() projects: ProjectModel[] = [];
  @Input() detailLevel: 'overview' | 'detailed' = 'detailed';
  @Input() highlightedSkills: readonly string[] = [];
  @Input() showEmpty = false;

  trackProject(_index: number, project: ProjectModel): number {
    return project.id;
  }

  isHot(keyword: string): boolean {
    return this.highlightedSkills?.includes(keyword) ?? false;
  }

  isHighlighted(project: ProjectModel): boolean {
    if (!this.highlightedSkills || this.highlightedSkills.length === 0) {
      return false;
    }
    return project.keywords.some((keyword) => this.highlightedSkills.includes(keyword));
  }
}
