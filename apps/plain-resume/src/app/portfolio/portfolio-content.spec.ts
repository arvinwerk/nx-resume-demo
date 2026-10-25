import { readFileSync } from 'fs';
import { join } from 'path';

describe('portfolio catalog file', () => {
  const projects = JSON.parse(
    readFileSync(join(__dirname, '../../assets/portfolio/projects.json'), 'utf8')
  ) as Array<{
    company: string;
    title: string;
    shortDescription: string;
    longDescription: string | null;
    keywords: string[];
  }>;

  it('keeps the verified project list', () => {
    expect(projects).toHaveLength(10);
    expect(projects.map((project) => project.company)).toEqual([
      'We-Invite',
      'We-Invite',
      'Arpo entertainment',
      'Ziggo',
      'Ziggo',
      'Arpo entertainment',
      'Temporary Work Design',
      'Sanoma',
      'Meander ziekenhuis Amersfoort',
      'Arpo entertainment',
    ]);
    expect(projects.every((project) => project.shortDescription && project.keywords.length > 0)).toBe(true);
    expect(JSON.stringify(projects)).toContain('https://vvalvip2024.we-invite.shop');
    expect(JSON.stringify(projects)).toContain('Prime Minister Rutte');
    expect(JSON.stringify(projects)).toContain('Queen Máxima');
    expect(JSON.stringify(projects)).toContain('ziggo.nl');
    expect(JSON.stringify(projects)).toContain('Zandvoort');
    expect(JSON.stringify(projects)).not.toMatch(/\d+%/);
  });
});
