import type { SpellingWeek, WordProgress } from './store';

export type PracticeMode = 'quick' | 'review' | 'test';

function needsReview(stats?: WordProgress): boolean {
  return !!stats && (stats.misses > 0 || stats.assistedCorrect > 0) &&
    stats.firstTryCorrect < Math.max(2, stats.misses + 1);
}
function lastPracticed(stats?: WordProgress): number {
  if (!stats?.lastPracticedAt) return 0;
  const date = Date.parse(stats.lastPracticedAt);
  return Number.isFinite(date) ? date : 0;
}

/**
 * Prioritize still-tricky words; make sure unseen words are included.
 * Revisit previous words in later sessions. The order is intentionally mixed
 * rather than using a fixed alphabetic drill. This is a simple heuristic,
 * NOT a diagnostic or a validated mastery model.
 */
export function selectPracticeWords(week: SpellingWeek, mode: PracticeMode): string[] {
  const words = [...week.words];
  const progress = week.progress;
  if (mode === 'test') return words;

  const priority = (a: string, b: string): number => {
    const pa = progress[a], pb = progress[b];
    const misses = (pb?.misses ?? 0) - (pa?.misses ?? 0);
    if (misses) return misses;
    const firstTries = (pa?.firstTryCorrect ?? 0) - (pb?.firstTryCorrect ?? 0);
    if (firstTries) return firstTries;
    const age = lastPracticed(pa) - lastPracticed(pb);
    return age || a.localeCompare(b);
  };

  const struggling = words.filter(word => needsReview(progress[word])).sort(priority);
  if (mode === 'review') return struggling.slice(0, 8);

  const unseen = words.filter(word => !progress[word]?.attempts);
  const older = words.filter(word => progress[word]?.attempts && !needsReview(progress[word])).sort(priority);
  const mixed = [
    ...struggling.slice(0, 2),
    ...unseen.slice(0, 3),
    ...struggling.slice(2),
    ...older,
    ...unseen.slice(3)
  ];
  return [...new Set(mixed)].slice(0, 5);
}

export function reviewCount(week: SpellingWeek): number {
  return week.words.filter(word => needsReview(week.progress[word])).length;
}
