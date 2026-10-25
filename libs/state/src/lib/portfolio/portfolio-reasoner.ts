import {
  CatalogProject,
  ChatTurn,
  OPENING_QUESTIONS,
  PortfolioAIResponse,
  PortfolioAction,
  PortfolioCatalog,
} from './portfolio.types';

/**
 * Catalog-grounded interpreter used when no model endpoint is configured.
 * Conversation starters and free-text questions share this function. It
 * returns the same response contract as the remote model.
 */
export function reasonOffline(
  history: readonly ChatTurn[],
  catalog: PortfolioCatalog
): PortfolioAIResponse {
  const latest = [...history].reverse().find((turn) => turn.role === 'user');
  const text = latest?.content.trim() ?? '';
  const dutch = prefersDutch(text);

  if (!text || catalog.projects.length === 0) {
    return {
      message: catalog.projects.length === 0
        ? (dutch
          ? 'De portfolio is nog aan het laden. Vraag het zo meteen opnieuw.'
          : 'The portfolio is still loading. Ask again in a moment.')
        : (dutch
          ? 'Vraag naar het werk, de techniek, of wat ik meebreng naar een team.'
          : 'Ask about the work, the stack, or what I would bring to a team.'),
      actions: [],
      suggestedQuestions: [...OPENING_QUESTIONS],
    };
  }

  const context = createContext(text, catalog, dutch);
  const intent = detectIntent(context);
  return {
    message: messageFor(intent, context),
    actions: actionsFor(intent, context),
    suggestedQuestions: suggestionsFor(intent, context, text),
  };
}

type Intent =
  | 'reset'
  | 'metrics'
  | 'count'
  | 'unknown-org'
  | 'unknown-skill'
  | 'clear-filter'
  | 'detail-more'
  | 'detail-less'
  | 'skill'
  | 'company'
  | 'project'
  | 'ai'
  | 'organization'
  | 'built'
  | 'developer'
  | 'ambiguous';

interface ReasonContext {
  text: string;
  dutch: boolean;
  catalog: PortfolioCatalog;
  mentionedSkills: string[];
  mentionedCompanies: string[];
  mentionedProjects: CatalogProject[];
  requestedTopic: string | null;
}

const SKILL_ALIASES: { pattern: string; skill: string }[] = [
  { pattern: 'node.js', skill: 'NodeJS' },
  { pattern: 'node', skill: 'NodeJS' },
  { pattern: 'sails', skill: 'SailsJS' },
  { pattern: '.net', skill: 'DOT.NET' },
  { pattern: 'dotnet', skill: 'DOT.NET' },
  { pattern: 'c sharp', skill: 'C#' },
  { pattern: 'csharp', skill: 'C#' },
  { pattern: 'c#', skill: 'C#' },
];

const GENERIC_COMPANY_HEADS = new Set(['the', 'temporary', 'internal', 'national']);

function createContext(text: string, catalog: PortfolioCatalog, dutch: boolean): ReasonContext {
  return {
    text: text.toLowerCase(),
    dutch,
    catalog,
    mentionedSkills: findSkills(text, catalog.skills),
    mentionedCompanies: findCompanies(text, catalog.companies),
    mentionedProjects: findMentionedProjects(text, catalog.projects),
    requestedTopic: requestedTopic(text),
  };
}

function detectIntent(context: ReasonContext): Intent {
  const text = context.text;

  if (/\b(reset|start over|original view|original page|restore the portfolio|opnieuw|oorspronkelijke)\b/.test(text)) {
    return 'reset';
  }
  if (/\b(revenue|omzet|users|kpi|percentage|conversion)\b/.test(text) || /\b\d+\s*%/.test(text)) {
    return 'metrics';
  }
  if (/\b(how many|hoeveel)\b/.test(text) && /\b(projects?|projecten)\b/.test(text)) {
    return 'count';
  }
  if (/\b(how many|hoeveel)\b/.test(text)) {
    return 'metrics';
  }
  if (
    /\b(did you work|have you worked|worked at|experience at|gewerkt bij|werkte je)\b/.test(text) &&
    context.mentionedCompanies.length === 0
  ) {
    return 'unknown-org';
  }
  if (/\b(clear the filter|show every project|all projects again|toon alles|alle projecten)\b/.test(text)) {
    return 'clear-filter';
  }
  if (/\b(more detail|more details|in depth|go deeper|technical detail|meer detail)\b/.test(text)) {
    return 'detail-more';
  }
  if (/\b(keep it short|shorter version|less detail|brief summary|korter)\b/.test(text)) {
    return 'detail-less';
  }
  if (
    context.requestedTopic &&
    context.mentionedSkills.length === 0 &&
    context.mentionedCompanies.length === 0
  ) {
    return 'unknown-skill';
  }
  if (
    context.mentionedSkills.length > 0 &&
    /\b(show|filter|only|work|projects?|built|build|laat|toon)\b/.test(text)
  ) {
    return 'skill';
  }
  if (
    context.mentionedCompanies.length > 0 &&
    /\b(about|work|project|tell|show|bij|laat)\b/.test(text)
  ) {
    return 'company';
  }
  if (
    context.mentionedProjects.length > 0 &&
    /\b(about|tell|show|what|work|project)\b/.test(text)
  ) {
    return 'project';
  }

  const scored: { id: Intent; score: number }[] = [
    { id: 'ai', score: score(text, [/\bai\b/, /artificial intelligence/, /machine learning/, /\bllm\b/, /kunstmatige/]) },
    { id: 'organization', score: score(text, [/organiz/, /organis/, /\bbring\b/, /\bhire\b/, /\bteam\b/, /\bvalue\b/, /\bbreng/]) },
    { id: 'built', score: score(text, [/\bbuil[dt]\b/, /\bprojects?\b/, /\bshipped\b/, /\bportfolio\b/, /gebouwd/, /projecten/]) },
    { id: 'developer', score: score(text, [/\bdeveloper\b/, /kind of/, /how do you work/, /\bstack\b/, /ontwikkelaar/]) },
  ];

  let best: Intent = 'ambiguous';
  let bestScore = 0;
  for (const item of scored) {
    if (item.score > bestScore) {
      best = item.id;
      bestScore = item.score;
    }
  }
  return best;
}

function actionsFor(intent: Intent, context: ReasonContext): PortfolioAction[] {
  switch (intent) {
    case 'reset':
      return [{ type: 'resetPortfolio' }];
    case 'metrics':
      return [
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'overview' },
      ];
    case 'count':
      return context.mentionedSkills.length > 0
        ? [
            { type: 'filterProjects', tags: context.mentionedSkills },
            { type: 'setLayout', value: 'projects' },
          ]
        : [{ type: 'setLayout', value: 'projects' }];
    case 'unknown-org':
    case 'unknown-skill':
    case 'ambiguous':
      return [];
    case 'clear-filter':
      return [{ type: 'filterProjects', tags: [] }];
    case 'detail-more':
      return [
        { type: 'setDetailLevel', value: 'detailed' },
        { type: 'setLayout', value: 'technical' },
      ];
    case 'detail-less':
      return [{ type: 'setDetailLevel', value: 'overview' }];
    case 'ai':
      return [
        { type: 'setAudience', value: 'developer' },
        { type: 'setLayout', value: 'technical' },
        { type: 'setDetailLevel', value: 'detailed' },
      ];
    case 'organization':
      return [
        { type: 'setAudience', value: 'manager' },
        { type: 'setLayout', value: 'impact' },
        { type: 'setDetailLevel', value: 'overview' },
        {
          type: 'highlightSkills',
          skills: context.mentionedSkills.length
            ? context.mentionedSkills
            : primarySkills(context.catalog.skills),
        },
        ...(context.mentionedSkills.length
          ? [{ type: 'filterProjects' as const, tags: context.mentionedSkills }]
          : []),
      ];
    case 'built':
      return [
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'detailed' },
        ...(context.mentionedSkills.length
          ? [
              { type: 'filterProjects' as const, tags: context.mentionedSkills },
              { type: 'highlightSkills' as const, skills: context.mentionedSkills },
            ]
          : []),
      ];
    case 'developer':
      return [
        { type: 'setAudience', value: 'developer' },
        { type: 'setLayout', value: 'technical' },
        { type: 'setDetailLevel', value: 'detailed' },
        {
          type: 'highlightSkills',
          skills: context.mentionedSkills.length
            ? context.mentionedSkills
            : primarySkills(context.catalog.skills),
        },
      ];
    case 'skill':
      return [
        { type: 'filterProjects', tags: context.mentionedSkills },
        { type: 'highlightSkills', skills: context.mentionedSkills },
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'detailed' },
      ];
    case 'company':
      return [
        { type: 'filterProjects', tags: context.mentionedCompanies },
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'detailed' },
      ];
    case 'project':
      return [
        { type: 'filterProjects', tags: unique(context.mentionedProjects.map((project) => project.company)) },
        { type: 'highlightSkills', skills: unique(context.mentionedProjects.flatMap((project) => [...project.keywords])).slice(0, 4) },
        { type: 'setLayout', value: 'projects' },
        { type: 'setDetailLevel', value: 'detailed' },
      ];
    default:
      return [];
  }
}

function messageFor(intent: Intent, context: ReasonContext): string {
  const dutch = context.dutch;
  const skills = primarySkills(context.catalog.skills);
  const titles = (source: readonly { title: string; company: string; summary: string; detail: string }[]) =>
    source.slice(0, 4).map((project) => `${project.title} (${project.company})`).join('; ');

  switch (intent) {
    case 'reset':
      return dutch
        ? 'De portfolio staat weer in de oorspronkelijke weergave.'
        : 'The portfolio is back to its original view.';
    case 'metrics':
      return dutch
        ? 'Die cijfers staan niet in de portfolio, dus ik vul ze niet in. Ik kan wel de projecten en de technieken laten zien.'
        : "Those figures are not in the portfolio, so I won't fill them in. I can show the projects and the stacks.";
    case 'count': {
      const matched = matchingProjects(context);
      const label = context.mentionedSkills.join(', ') || context.mentionedCompanies.join(', ');
      if (dutch) {
        return label
          ? `Er ${matched.length === 1 ? 'is' : 'zijn'} ${matched.length} project${matched.length === 1 ? '' : 'en'} met ${label}.`
          : `Er staan ${context.catalog.projects.length} projecten op deze pagina.`;
      }
      return label
        ? `There ${matched.length === 1 ? 'is' : 'are'} ${matched.length} project${matched.length === 1 ? '' : 's'} tagged ${label}.`
        : `There are ${context.catalog.projects.length} projects on this page.`;
    }
    case 'unknown-org':
      return dutch
        ? `Ik heb alleen werk staan bij ${context.catalog.companies.join(', ')}. Over die andere organisatie staat hier niets.`
        : `I only have work listed for ${context.catalog.companies.join(', ')}. Nothing here is about that other organisation.`;
    case 'unknown-skill':
      return dutch
        ? `Er is hier niets gelabeld als "${context.requestedTopic}". Ik kan ${context.catalog.skills.join(', ')} laten zien.`
        : `Nothing in the portfolio is tagged "${context.requestedTopic}". I can show ${context.catalog.skills.join(', ')}.`;
    case 'clear-filter':
      return dutch ? 'Alle projecten staan weer in beeld.' : 'Showing every project again.';
    case 'detail-more':
      return dutch
        ? 'Ik laat de langere projectnotities open.'
        : "I'll keep the longer project notes open.";
    case 'detail-less':
      return dutch ? 'Ik houd het bij de korte versie.' : "I'll keep this to the short version.";
    case 'ai':
      return dutch
        ? `${context.catalog.profile.aiBoundary} De projecten blijven de bron. Een vraag verandert alleen indeling, filters en nadruk.`
        : `${context.catalog.profile.aiBoundary} The projects stay the source of truth. A question only changes layout, filters, and emphasis.`;
    case 'organization':
      return dutch
        ? `Ik kan een team helpen met het soort producten dat hier staat: ${titles(context.catalog.projects)}. De technieken die daarbij terugkomen zijn ${skills.join(', ')}. Gebruiks- of omzetcijfers staan niet in deze portfolio, dus die verzin ik niet.`
        : `I can help a team with the kind of products listed here: ${titles(context.catalog.projects)}. The stacks that come back in that work are ${skills.join(', ')}. This portfolio has no usage or revenue figures, so I won't invent them.`;
    case 'built': {
      const list = titles(context.mentionedSkills.length ? matchingProjects(context) : context.catalog.projects);
      return dutch
        ? `Dit is het werk dat ik kan aanwijzen: ${list}.`
        : `The work I can point to includes ${list}.`;
    }
    case 'developer':
      return dutch
        ? `Ik werk aan de interface en aan de services daarachter. Op deze pagina is dat ${context.catalog.skills.slice(0, 8).join(', ')}. ${context.catalog.profile.workingStyle.join(' ')}`
        : `I work across the interface and the services behind it. On this page that shows up as ${context.catalog.skills.slice(0, 8).join(', ')}. ${context.catalog.profile.workingStyle.join(' ')}`;
    case 'skill':
    case 'company':
    case 'project': {
      const projects = intent === 'project' ? context.mentionedProjects : matchingProjects(context);
      if (projects.length === 0) {
        return dutch
          ? 'Geen project past bij die selectie.'
          : 'No project matches that selection.';
      }
      if (projects.length === 1) {
        const project = projects[0];
        const body = [project.summary, project.detail].filter((part) => part.length > 0).join(' ');
        return dutch
          ? `${project.title} bij ${project.company}: ${body}`
          : `${project.title} at ${project.company}: ${body}`;
      }
      return dutch
        ? `Dit past daarbij: ${titles(projects)}.`
        : `This is the matching work: ${titles(projects)}.`;
    }
    default:
      return dutch
        ? 'Ik kan deze pagina richten op het werk, de techniek, of wat ik meebreng naar een team. Wat wil je zien?'
        : 'I can adapt this page around the work, the stack, or what I would bring to a team. What do you want to see?';
  }
}

function suggestionsFor(intent: Intent, context: ReasonContext, asked: string): string[] {
  const dutch = context.dutch;
  const candidates: string[] = [];

  if (intent !== 'built') {
    candidates.push(dutch ? 'Wat heb je gebouwd?' : 'What have you built?');
  }
  if (intent !== 'organization') {
    candidates.push(dutch ? 'Wat breng je mee naar een organisatie?' : 'What can you bring to my organization?');
  }
  if (context.mentionedSkills.length === 0 && context.catalog.skills[0]) {
    candidates.push(
      dutch
        ? `Laat het ${context.catalog.skills[0]}-werk zien`
        : `Show me the ${context.catalog.skills[0]} work`
    );
  }
  const otherSkill = context.catalog.skills.find((skill) => !context.mentionedSkills.includes(skill));
  if (context.mentionedSkills.length > 0 && otherSkill) {
    candidates.push(dutch ? `Laat het ${otherSkill}-werk zien` : `Show me the ${otherSkill} work`);
  }
  if (context.mentionedSkills.length > 0 || context.mentionedCompanies.length > 0) {
    candidates.push(dutch ? 'Toon alle projecten' : 'Show every project again');
  }
  if (intent !== 'ai') {
    candidates.push(dutch ? 'Wat doe je met AI?' : 'What do you do with AI?');
  }
  if (intent !== 'developer') {
    candidates.push(dutch ? 'Wat voor ontwikkelaar ben je?' : 'What kind of developer are you?');
  }

  const unique: string[] = [];
  for (const question of candidates) {
    if (question.toLowerCase() === asked.trim().toLowerCase()) {
      continue;
    }
    if (unique.some((existing) => existing.toLowerCase() === question.toLowerCase())) {
      continue;
    }
    unique.push(question);
    if (unique.length === 3) {
      break;
    }
  }
  return unique;
}

function matchingProjects(context: ReasonContext) {
  return context.catalog.projects.filter((project) => {
    const skillMatch = context.mentionedSkills.some((skill) => project.keywords.includes(skill));
    const companyMatch = context.mentionedCompanies.includes(project.company);
    if (context.mentionedSkills.length === 0 && context.mentionedCompanies.length === 0) {
      return true;
    }
    return skillMatch || companyMatch;
  });
}

function primarySkills(skills: readonly string[]): string[] {
  const preferred = ['Angular', 'Laravel', 'Ionic', 'NodeJS', 'PHP', 'C#'];
  const picked = preferred.filter((skill) => skills.includes(skill));
  return (picked.length > 0 ? picked : [...skills]).slice(0, 5);
}

function findSkills(text: string, skills: readonly string[]): string[] {
  const found: string[] = [];
  const add = (skill: string) => {
    if (skills.includes(skill) && !found.includes(skill)) {
      found.push(skill);
    }
  };

  for (const skill of skills) {
    if (mentionsPhrase(text, skill)) {
      add(skill);
    }
  }

  const aliases = [...SKILL_ALIASES].sort((left, right) => right.pattern.length - left.pattern.length);
  for (const alias of aliases) {
    if (mentionsPhrase(text, alias.pattern)) {
      add(alias.skill);
    }
  }
  return found;
}

function findMentionedProjects(text: string, projects: readonly CatalogProject[]): CatalogProject[] {
  return projects.filter((project) => {
    if (mentionsPhrase(text, project.title)) {
      return true;
    }
    const words = project.title.split(/[^a-z0-9+#]+/i).filter((word) => word.length >= 5);
    const hits = words.filter((word) => mentionsPhrase(text, word));
    return hits.some((word) => word.length >= 8) || hits.length >= 2;
  });
}

function unique(values: readonly string[]): string[] {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function findCompanies(text: string, companies: readonly string[]): string[] {
  return companies.filter((company) => {
    if (mentionsPhrase(text, company)) {
      return true;
    }
    const head = company.split(/\s+/)[0] ?? '';
    if (head.length < 4 || GENERIC_COMPANY_HEADS.has(head.toLowerCase())) {
      return false;
    }
    return mentionsPhrase(text, head);
  });
}

function requestedTopic(text: string): string | null {
  const match = text.match(/\bshow me (?:the )?([a-z0-9.+#-]{2,32}) (?:work|projects?)\b/i);
  return match?.[1]?.trim() ?? null;
}

function mentionsPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|[^a-z0-9+#])${escaped}(?:[^a-z0-9+#]|$)`, 'i').test(text);
}

function score(text: string, patterns: readonly RegExp[]): number {
  return patterns.reduce((total, pattern) => total + (pattern.test(text) ? 1 : 0), 0);
}

function prefersDutch(text: string): boolean {
  if (/\b(gebouwd|organisatie|ontwikkelaar|projecten|kunstmatige|oorspronkelijke|toon|laat|alle)\b/i.test(text)) {
    return true;
  }
  const weak = text.match(/\b(wat|je|jij|niet|hoe|welke)\b/gi);
  return (weak?.length ?? 0) >= 2;
}
