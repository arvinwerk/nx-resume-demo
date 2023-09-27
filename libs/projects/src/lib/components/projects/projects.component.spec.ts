import { ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { ProjectsComponent } from './projects.component';

describe('ProjectsComponent', () => {
  let component: ProjectsComponent;
  let fixture: ComponentFixture<ProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('It should render projects', () => {
    component.projects = [{
      id: 1,
      title: 'Demo title',
      shortDescription: 'demo short description',
      longDescription: 'demo long description',
      company: 'Demo company',
      images: [],
      keywords: ['demo']
    }];

    const compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    expect(compiled.querySelector('h2')?.textContent).toContain(component.projects[0].title);
    expect(compiled.querySelector('[data-type="longDescription"]')?.textContent).toContain(component.projects[0].longDescription);
  });
});
