import { ProjectModel } from '@nx-resume/projects';
import { CatalogProject, PortfolioCatalog, PortfolioProfile } from './portfolio.types';

export interface CompanyGroup {
  company: string;
  projects: ProjectModel[];
}

export function plainText(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildCatalog(
  profile: PortfolioProfile,
  projects: readonly ProjectModel[]
): PortfolioCatalog {
  const catalogProjects: CatalogProject[] = projects.map((project) => ({
    id: project.id,
    company: project.company,
    title: project.title,
    summary: plainText(project.shortDescription),
    detail: plainText(project.longDescription),
    keywords: [...project.keywords],
  }));

  return {
    profile,
    projects: catalogProjects,
    skills: unique(catalogProjects.flatMap((project) => project.keywords)),
    companies: unique(catalogProjects.map((project) => project.company)),
  };
}

export function groupByCompany(projects: readonly ProjectModel[]): CompanyGroup[] {
  const groups: CompanyGroup[] = [];

  for (const project of projects) {
    const existing = groups.find((group) => group.company === project.company);
    if (existing) {
      existing.projects.push(project);
    } else {
      groups.push({ company: project.company, projects: [project] });
    }
  }

  return groups;
}

function unique(values: readonly string[]): string[] {
  const result: string[] = [];
  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}
