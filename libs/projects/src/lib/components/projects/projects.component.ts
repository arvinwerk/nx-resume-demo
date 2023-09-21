import { Component, Input } from '@angular/core';
import { ProjectModel } from '../../models/project.model';

@Component({
  selector: 'nx-resume-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css'],
})
export class ProjectsComponent {
  @Input() projects: ProjectModel[] = [];
}
