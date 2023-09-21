import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectService } from './services/project.service';
import { HttpClientModule } from '@angular/common/http';
import { ProjectFilterComponent } from './project-filter/project-filter.component';

@NgModule({
  imports: [CommonModule, HttpClientModule],
  declarations: [ProjectsComponent, ProjectFilterComponent],
  providers: [ProjectService],
  exports: [ProjectsComponent, ProjectFilterComponent],
})
export class ProjectsModule {}
