import { TestBed } from '@angular/core/testing';

import { ProjectService } from './project.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { of } from 'rxjs';

const projects = [{
  id: 1,
  title: 'Demo title',
  shortDescription: 'demo short description',
  longDescription: 'demo long description',
  company: 'Demo company',
  images: [],
  keywords: ['demo']
}];

describe('ProjectService', () => {
  let service: ProjectService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{provide: HttpClient, useValue: {
        get: jest.fn(() => of(projects)),
      }}]
    });
    service = TestBed.inject(ProjectService);
  });

  it('Should get products', () => {
    service.getProjects().subscribe((res) => {
      expect(res).toEqual(projects);
    });

  });
});
