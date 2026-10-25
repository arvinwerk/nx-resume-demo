import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ProjectModel } from '../models/project.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  httpClient: HttpClient;

  constructor() { 
    this.httpClient = inject(HttpClient);
  }

  getProjects(): Observable<ProjectModel[]> {
    return this.httpClient.get<ProjectModel[]>('/assets/portfolio/projects.json').pipe(map((projects) => projects.map((project, index) => ({
      ...project,
      id: index + 1
    }))));
  }
}
