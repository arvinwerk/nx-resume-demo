import { TestBed } from '@angular/core/testing';
import {AppStore} from './app-store';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppStore', () => {
  let service: AppStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(AppStore);
  });

  it('It should set projects', () => {
    const products = [{
      id: 1,
      title: 'Demo title',
      shortDescription: 'demo short description',
      longDescription: 'demo long description',
      company: 'Demo company',
      images: [],
      keywords: ['demo']
    }];

    service.setProducts(products);
    
    expect(service.filteredProjects$()).toEqual(products);
  });

  it('filters by skill and by organisation, and releases the filter again', () => {
    service.setProducts([
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
    ]);

    service.toggleSelection('Laravel');
    expect(service.filteredProjects$().map((project) => project.title)).toEqual(['Shop']);

    service.toggleSelection('Laravel');
    expect(service.filteredProjects$()).toHaveLength(2);

    service.setSelectedKeywords(['Ziggo']);
    expect(service.filteredProjects$().map((project) => project.title)).toEqual(['Middleware']);
  });
});
