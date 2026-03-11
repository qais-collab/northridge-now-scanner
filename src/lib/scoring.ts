import type { Article } from './types';

export interface ScoringWeights {
  strongLocal: number;
  priorityKeyword: number;
  hyperlocalSource: number;
  fresh24h: number;
  recent72h: number;
  sportsNoLocal: number;
  missingDate: number;
  duplicate: number;
  outsideCoverage: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  strongLocal: 3,
  priorityKeyword: 2,
  hyperlocalSource: 1,
  fresh24h: 2,
  recent72h: 1,
  sportsNoLocal: -2,
  missingDate: -2,
  duplicate: -2,
  outsideCoverage: -2,
};

const STRONG_LOCAL_AREAS = [
  'Northridge', 'Porter Ranch', 'Granada Hills', 'Chatsworth',
  'Reseda', 'Winnetka', 'North Hills', 'Canoga Park',
  'Mission Hills', 'San Fernando Valley',
];
const STRONG_LOCAL_RE = /\b(Northridge|Porter\s+Ranch|Granada\s+Hills|Chatsworth|Reseda|Winnetka|North\s+Hills|Canoga\s+Park|Mission\s+Hills|CSUN|San\s+Fernando\s+Valley)\b/i;
const PRIORITY_RE = /\b(fire|shooting|police|evacuation|road\s+closure|development|restaurant\s+opening|school\s+board|construction|earthquake|crash|arrest|homicide|robbery|power\s+outage|water\s+main|zoning|council\s+vote)\b/i;
const SPORTS_RE = /\b(basketball|baseball|football|soccer|tournament|athletics|sports)\b/i;

export function calculateRelevanceScore(
  article: Pick<Article, 'title' | 'neighborhood_guess' | 'topic_guess' | 'published_at' | 'is_duplicate'>,
  sourcePriority: number = 5,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const neighborhood = article.neighborhood_guess || '';

  // Strong local signal
  if (STRONG_LOCAL_AREAS.includes(neighborhood) || STRONG_LOCAL_RE.test(title)) {
    score += weights.strongLocal;
  }

  // Priority keyword
  if (PRIORITY_RE.test(title)) score += weights.priorityKeyword;

  // Hyperlocal source bonus
  if (sourcePriority >= 8) score += weights.hyperlocalSource;

  // Freshness
  if (article.published_at) {
    const hours = (Date.now() - new Date(article.published_at).getTime()) / 3600000;
    if (hours <= 24) score += weights.fresh24h;
    else if (hours <= 72) score += weights.recent72h;
  } else {
    score += weights.missingDate;
  }

  // Sports without local context
  if (SPORTS_RE.test(title) && !STRONG_LOCAL_RE.test(title)) {
    score += weights.sportsNoLocal;
  }

  if (article.is_duplicate) score += weights.duplicate;

  const knownAreas = [...STRONG_LOCAL_AREAS, 'Mission Hills', 'Unknown'];
  if (neighborhood && !knownAreas.includes(neighborhood)) {
    score += weights.outsideCoverage;
  }

  return Math.max(0, score);
}
