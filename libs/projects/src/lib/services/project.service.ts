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

  // Stub for API. Creating an API is out of the scope of my demo
  getProjects(): Observable<ProjectModel[]> {
    return this.httpClient.get<ProjectModel[]>('/assets/api/projects.json').pipe(map((projects) => projects.map((project, index) => ({
      ...project,
      id: index + 1
    }))));
  }
}
