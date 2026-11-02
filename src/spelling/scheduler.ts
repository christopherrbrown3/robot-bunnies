import type { SpellingData, SpellingWeek, WordProgress } from './store';

export type PracticeMode = 'campaign' | 'review' | 'test';
export type CampaignSource = 'current' | 'previous';

export interface CampaignStep {
  levelId: number;
  weekId: string;
  word: string;
  source: CampaignSource;
}

const CAMPAIGN_LEVELS = 22;

function needsReview(stats?: WordProgress): boolean {
  return !!stats && (stats.misses > 0 || stats.assistedCorrect > 0) &&
    stats.firstTryCorrect < Math.max(2, stats.misses + 1);
}

function lastPracticed(stats?: WordProgress): number {
  if (!stats?.lastPracticedAt) return 0;
  const date = Date.parse(stats.lastPracticedAt);
  return Number.isFinite(date) ? date : 0;
}

function wordPriority(a: string, b: string, progress: Record<string, WordProgress>): number {
  const pa = progress[a], pb = progress[b];
  const hard = Number(needsReview(pb)) - Number(needsReview(pa));
  if (hard) return hard;
  const missed = (pb?.misses ?? 0) - (pa?.misses ?? 0);
  if (missed) return missed;
  const success = (pa?.firstTryCorrect ?? 0) - (pb?.firstTryCorrect ?? 0);
  if (success) return success;
  return lastPracticed(pa) - lastPracticed(pb) || a.localeCompare(b);
}

/** Optional extra practice; there is never a mandatory short-session limit. */
export function selectPracticeWords(week: SpellingWeek, mode: 'review' | 'test'): string[] {
  if (mode === 'test') return [...week.words];
  const difficult = week.words.filter(word => needsReview(week.progress[word]));
  return (difficult.length ? difficult : week.words).sort((a, b) => wordPriority(a, b, week.progress));
}

export function reviewCount(week: SpellingWeek): number {
  return week.words.filter(word => needsReview(week.progress[word])).length;
}

/**
 * Assign ONE spelling opportunity to each of 22 story levels.
 *
 * Each school word appears at least once, regardless of whether a list has
 * 1, 10, 15 or 20 words. Spare levels repeat current tricky/less-practiced
 * words and include a few earlier-week words when available. No time limit.
 *
 * Caller persists this plan at the start of a playthrough. Do not regenerate
 * it when progress/stats change halfway through an adventure.
 */
export function createCampaignPlan(data: SpellingData, runNumber = 0): CampaignStep[] {
  const current = data.weeks.find(w => w.id === data.activeWeekId);
  if (!current?.words.length || current.words.length > CAMPAIGN_LEVELS) {
    throw new Error('Please activate a weekly spelling list first.');
  }

  const run = Math.max(0, Math.floor(runNumber));
  const currentWords = [...current.words].sort((a, b) => wordPriority(a, b, current.progress));
  const rotate = run % currentWords.length;
  const ordered = [...currentWords.slice(rotate), ...currentWords.slice(0, rotate)];

  const plan: Array<CampaignStep | null> = Array(CAMPAIGN_LEVELS).fill(null);
  const useCurrent = (levelIndex: number, word: string): void => {
    plan[levelIndex] = { levelId: levelIndex + 1, weekId: current.id, word, source: 'current' };
  };

  ordered.forEach((word, i) => {
    // Spread the unique current-list words across the 22 places.
    const position = Math.floor((i + 0.5) * CAMPAIGN_LEVELS / ordered.length);
    useCurrent(position, word);
  });

  const spareIndices = plan.flatMap((entry, i) => entry ? [] : [i]);
  const previous: { word: string; weekId: string; stats?: WordProgress }[] = [];
  const seen = new Set(current.words);
  for (const week of data.weeks) {
    if (week.id === current.id) continue;
    for (const word of week.words) {
      if (seen.has(word)) continue;
      seen.add(word);
      previous.push({ word, weekId: week.id, stats: week.progress[word] });
    }
  }
  previous.sort((a, b) => {
    const hard = Number(needsReview(b.stats)) - Number(needsReview(a.stats));
    if (hard) return hard;
    return (b.stats?.misses ?? 0) - (a.stats?.misses ?? 0) ||
      lastPracticed(a.stats) - lastPracticed(b.stats) || a.word.localeCompare(b.word);
  });
  if (previous.length) {
    const offset = run % previous.length;
    previous.push(...previous.splice(0, offset));
  }
  // Current-week words are always the priority; older weeks reinforce only
  // spare levels, at most four of the 22.
  const previousQuota = Math.min(previous.length, 4, Math.ceil(spareIndices.length / 3));
  const repeatedCurrent = [...currentWords];
  let previousUsed = 0;
  let repeatUsed = 0;

  spareIndices.forEach((position, extraIndex) => {
    const slotsRemaining = spareIndices.length - extraIndex;
    const prevRemaining = previousQuota - previousUsed;
    const placePrevious = prevRemaining > 0 &&
      (slotsRemaining === prevRemaining ||
        Math.floor((extraIndex + 1) * previousQuota / spareIndices.length) >
        Math.floor(extraIndex * previousQuota / spareIndices.length));
    if (placePrevious) {
      const candidate = previous[previousUsed++];
      plan[position] = { levelId: position + 1, weekId: candidate.weekId, word: candidate.word, source: 'previous' };
      return;
    }
    // Favor words that still need work, distributed to avoid repeating the
    // immediately adjacent prompt when multiple options are available.
    let candidate = repeatedCurrent[repeatUsed % repeatedCurrent.length];
    const neighborBefore = plan[position - 1]?.word;
    const neighborAfter = plan[position + 1]?.word;
    for (let tries = 0; tries < repeatedCurrent.length; tries++) {
      const word = repeatedCurrent[(repeatUsed + tries) % repeatedCurrent.length];
      if (word !== neighborBefore && word !== neighborAfter) {
        candidate = word;
        repeatUsed += tries;
        break;
      }
    }
    repeatUsed++;
    useCurrent(position, candidate);
  });

  return plan.map(step => {
    if (!step) throw new Error('Campaign planner left a level empty.');
    return step;
  });
}
