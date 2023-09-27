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
});
