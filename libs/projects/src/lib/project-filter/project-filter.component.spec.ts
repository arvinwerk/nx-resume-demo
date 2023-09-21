import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProjectFilterComponent } from './project-filter.component';

describe('ProjectFilterComponent', () => {
  let component: ProjectFilterComponent;
  let fixture: ComponentFixture<ProjectFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectFilterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('It should emit keywords', () => {       
    jest.spyOn(component.keywordClicked, 'emit');

    component.toggleKeyword({key:'test', selected: true});
    expect(component.keywordClicked.emit).toHaveBeenCalled();
  });
});
