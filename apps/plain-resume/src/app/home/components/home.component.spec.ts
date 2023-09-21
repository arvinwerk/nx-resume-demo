import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA, inject } from '@angular/core';
import { ProjectService } from '@nx-resume/projects';
import { of } from 'rxjs';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let projectService: ProjectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientModule],
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
    

    const spyObj = jest.spyOn(projectService, 'getProjects').mockReturnValue(of(products));
    component.ngOnInit();
    expect(component.projects$()).toEqual(products);
  });
});
