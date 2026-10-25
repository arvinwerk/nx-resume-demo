import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProjectService } from '@nx-resume/projects';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let projectService: ProjectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule, CommonModule],
      declarations: [HomeComponent],
      providers: [ProjectService],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    projectService = TestBed.inject(ProjectService);
    fixture.detectChanges();
  });

  it('should init the products', () => {
    const products = [{
      id: 1,
      title: 'Demo title',
      shortDescription: 'demo short description',
      longDescription: 'demo long description',
      company: 'Demo company',
      images: [],
      keywords: ['demo']
    }];
    

    jest.spyOn(projectService, 'getProjects').mockReturnValue(of(products));
    component.ngOnInit();
    expect(component.projects$()).toEqual(products);
  });

  it('applies validated portfolio actions to the existing project filter', () => {
    const products = [
      {
        id: 1,
        title: 'Shop',
        shortDescription: 'shop',
        longDescription: null,
        company: 'We-Invite',
        images: [],
        keywords: ['Laravel']
      },
      {
        id: 2,
        title: 'Middleware',
        shortDescription: 'middleware',
        longDescription: null,
        company: 'Ziggo',
        images: [],
        keywords: ['NodeJS']
      }
    ];
    jest.spyOn(projectService, 'getProjects').mockReturnValue(of(products));
    component.ngOnInit();

    component.onPortfolioActions([
      { type: 'filterProjects', tags: ['Laravel'] },
      { type: 'setLayout', value: 'impact' }
    ]);

    expect(component.projects$().map((project) => project.title)).toEqual(['Shop']);
    expect(component.presentation.layout()).toBe('impact');
    expect(component.presentation.sections()).toEqual(['intro', 'experience', 'skills']);

    component.resetPortfolio();
    expect(component.projects$()).toHaveLength(2);
    expect(component.presentation.layout()).toBe('default');
  });
});
