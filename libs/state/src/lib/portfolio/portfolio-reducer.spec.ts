import { buildCatalog } from './portfolio-catalog';
import {
  adaptationSummary,
  applyPortfolioActions,
  isInitialPresentation,
  sectionsFor,
} from './portfolio-reducer';
import { INITIAL_PRESENTATION, PortfolioProfile } from './portfolio.types';

const profile: PortfolioProfile = {
  name: 'Arvin Sokarijo',
  role: 'Full-stack developer',
  summary: 'Builds products.',
  aiBoundary: 'No shipped AI product is listed.',
  workingStyle: ['Signals for state'],
};

const catalog = buildCatalog(profile, [
  {
    id: 1,
    company: 'Ziggo',
    title: 'Middleware',
    shortDescription: 'Outage data',
    longDescription: null,
    keywords: ['NodeJS'],
    images: [],
  },
  {
    id: 2,
    company: 'We-Invite',
    title: 'VIP shop',
    shortDescription: 'Shop',
    longDescription: '<b>Angular</b> storefront',
    keywords: ['Angular', 'Laravel'],
    images: [],
  },
]);

describe('portfolio presentation', () => {
  it('describes each layout as a fixed section order', () => {
    expect(sectionsFor('default')).toEqual(['intro', 'skills', 'projects']);
    expect(sectionsFor('projects')).toEqual(['intro', 'projects', 'skills']);
    expect(sectionsFor('impact')).toEqual(['intro', 'experience', 'skills']);
    expect(sectionsFor('technical')).toEqual(['intro', 'skills', 'projects']);
  });

  it('applies actions in order and can return to the original view', () => {
    const adapted = applyPortfolioActions(
      INITIAL_PRESENTATION,
      [
        { type: 'setAudience', value: 'manager' },
        { type: 'setLayout', value: 'impact' },
        { type: 'setDetailLevel', value: 'overview' },
        { type: 'highlightSkills', skills: ['Angular', 'Missing'] },
        { type: 'filterProjects', tags: ['Ziggo'] },
      ],
      catalog
    );

    expect(adapted).toEqual({
      audience: 'manager',
      layout: 'impact',
      detailLevel: 'overview',
      highlightedSkills: ['Angular'],
      projectTags: ['Ziggo'],
    });
    expect(isInitialPresentation(adapted)).toBe(false);
    expect(adaptationSummary(adapted)).toContain('impact layout');
    expect(adaptationSummary(adapted)).toContain('Ziggo');

    const reset = applyPortfolioActions(adapted, [{ type: 'resetPortfolio' }], catalog);
    expect(reset).toEqual(INITIAL_PRESENTATION);
    expect(adaptationSummary(reset)).toBeNull();
  });

  it('does not clear a filter when every requested tag is unknown', () => {
    const current = { ...INITIAL_PRESENTATION, projectTags: ['Angular'] };
    const next = applyPortfolioActions(
      current,
      [{ type: 'filterProjects', tags: ['Rust'] }],
      catalog
    );
    expect(next.projectTags).toEqual(['Angular']);
  });

  it('strips HTML while building the catalog', () => {
    expect(catalog.projects[1]?.detail).toBe('Angular storefront');
    expect(catalog.skills).toEqual(['NodeJS', 'Angular', 'Laravel']);
  });
});
