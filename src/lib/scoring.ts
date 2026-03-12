import type { Article } from './types';

export interface ScoringWeights {
  strongLocal: number;
  otherValley: number;
  landmarkSignal: number;
  streetSignal: number;
  priorityKeyword: number;
  hyperlocalSource: number;
  fresh24h: number;
  recent72h: number;
  sportsNoLocal: number;
  missingDate: number;
  duplicate: number;
  noLocation: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  strongLocal: 3,
  otherValley: 2,
  landmarkSignal: 1,
  streetSignal: 1,
  priorityKeyword: 2,
  hyperlocalSource: 1,
  fresh24h: 2,
  recent72h: 1,
  sportsNoLocal: -2,
  missingDate: -2,
  duplicate: -2,
  noLocation: -2,
};

const STRONG_LOCAL_CITIES = new Set([
  'Northridge', 'Porter Ranch', 'Granada Hills', 'Chatsworth',
]);

const OTHER_VALLEY_CITIES = new Set([
  'Reseda', 'Winnetka', 'North Hills', 'Canoga Park', 'Mission Hills',
  'Lake Balboa', 'Van Nuys', 'Sherman Oaks', 'Encino', 'San Fernando',
  'Tarzana', 'Woodland Hills', 'West Hills', 'Pacoima', 'Arleta',
  'Sylmar', 'Sun Valley', 'Panorama City', 'Studio City',
]);

const STRONG_LOCAL_RE = /\b(Northridge|Porter\s+Ranch|Granada\s+Hills|Chatsworth)\b/i;
const OTHER_VALLEY_RE = /\b(Reseda|Winnetka|North\s+Hills|Canoga\s+Park|Mission\s+Hills|Lake\s+Balboa|Van\s+Nuys|Sherman\s+Oaks|Encino|Tarzana|Woodland\s+Hills|West\s+Hills|Pacoima|Arleta|Sylmar|Sun\s+Valley|Panorama\s+City|Studio\s+City|San\s+Fernando)\b/i;
const LANDMARK_RE = /\b(CSUN|Cal\s+State\s+Northridge|Devonshire\s+Division|Topanga\s+Canyon|Balboa\s+Park|Van\s+Nuys\s+Airport|Sepulveda\s+Basin|Stoney\s+Point|Granada\s+Hills\s+Charter|Cleveland\s+High|Porter\s+Ranch\s+Town\s+Center)\b/i;
const STREET_RE = /\b(118\s*(freeway|fwy)|405\s*(freeway|fwy)|101\s*(freeway|fwy)|Reseda\s+Blvd|Balboa\s+Blvd|Topanga\s+Canyon\s+Blvd|Rinaldi|Sesnon|Nordhoff\s+St|Devonshire\s+St|De\s+Soto\s+Ave)\b/i;
const PRIORITY_RE = /\b(fire|shooting|police|evacuation|road\s+closure|development|restaurant\s+opening|school\s+board|construction|earthquake|crash|arrest|homicide|robbery|power\s+outage|water\s+main|zoning|council\s+vote)\b/i;
const SPORTS_RE = /\b(basketball|baseball|football|soccer|tournament|athletics|sports)\b/i;

export function calculateRelevanceScore(
  article: Pick<Article, 'title' | 'neighborhood_guess' | 'topic_guess' | 'published_at' | 'is_duplicate'>,
  sourcePriority: number = 5,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;
  const title = (article.title || '');
  const neighborhood = article.neighborhood_guess || '';

  // Tiered location scoring
  if (STRONG_LOCAL_CITIES.has(neighborhood) || STRONG_LOCAL_RE.test(title)) {
    score += weights.strongLocal;
  } else if (OTHER_VALLEY_CITIES.has(neighborhood) || OTHER_VALLEY_RE.test(title)) {
    score += weights.otherValley;
  } else if (LANDMARK_RE.test(title)) {
    score += weights.landmarkSignal;
  } else if (STREET_RE.test(title)) {
    score += weights.streetSignal;
  } else if (neighborhood === 'San Fernando Valley' || neighborhood === 'Unknown' || !neighborhood) {
    score += weights.noLocation;
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
  if (SPORTS_RE.test(title) && !STRONG_LOCAL_RE.test(title) && !OTHER_VALLEY_RE.test(title)) {
    score += weights.sportsNoLocal;
  }

  if (article.is_duplicate) score += weights.duplicate;

  return Math.max(0, score);
}
