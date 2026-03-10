import type { Article } from './types';

export interface ScoringWeights {
  northridgeMention: number;
  adjacentArea: number;
  fresh24h: number;
  recent72h: number;
  priorityTopic: number;
  eventsOrBusiness: number;
  duplicate: number;
  outsideCoverage: number;
  highPrioritySource: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  northridgeMention: 3,
  adjacentArea: 2,
  fresh24h: 2,
  recent72h: 1,
  priorityTopic: 2,
  eventsOrBusiness: 1,
  duplicate: -2,
  outsideCoverage: -2,
  highPrioritySource: 1,
};

const ADJACENT_AREAS = ['Porter Ranch', 'Granada Hills', 'Chatsworth', 'Reseda', 'Winnetka', 'North Hills', 'Canoga Park'];
const PRIORITY_TOPICS = ['public_safety', 'schools', 'civic_planning', 'breaking_news'];
const EVENTS_BUSINESS = ['events', 'business'];

export function calculateRelevanceScore(
  article: Pick<Article, 'title' | 'neighborhood_guess' | 'topic_guess' | 'published_at' | 'is_duplicate'>,
  sourcePriority: number = 5,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;
  const title = (article.title || '').toLowerCase();
  const neighborhood = article.neighborhood_guess || '';
  const topic = article.topic_guess || '';

  if (neighborhood === 'Northridge' || title.includes('northridge')) {
    score += weights.northridgeMention;
  }
  if (ADJACENT_AREAS.includes(neighborhood)) {
    score += weights.adjacentArea;
  }

  if (article.published_at) {
    const hours = (Date.now() - new Date(article.published_at).getTime()) / 3600000;
    if (hours <= 24) score += weights.fresh24h;
    else if (hours <= 72) score += weights.recent72h;
  }

  if (PRIORITY_TOPICS.includes(topic)) score += weights.priorityTopic;
  if (EVENTS_BUSINESS.includes(topic)) score += weights.eventsOrBusiness;
  if (article.is_duplicate) score += weights.duplicate;

  const knownAreas = ['Northridge', ...ADJACENT_AREAS, 'Mission Hills', 'San Fernando Valley'];
  if (neighborhood && !knownAreas.includes(neighborhood) && neighborhood !== 'Unknown') {
    score += weights.outsideCoverage;
  }

  if (sourcePriority >= 8) score += weights.highPrioritySource;

  return Math.max(0, score);
}
