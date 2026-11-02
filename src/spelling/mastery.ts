/**
 * Word security model from FINAL_SPEC §5.
 *
 * - Independent success: first full spelling on a presentation is correct with
 *   no Peek, Hint, prior miss or correction. Replaying audio is allowed.
 * - Secure: two independent successes since the latest miss/assist/skip.
 *   Same-day successes count; distinct dates are tracked as extra evidence but
 *   never block progress.
 * - Any miss, assisted success or skip resets the streak.
 *
 * Pure functions only: no storage access, so tests can exercise them directly.
 */

export interface WordProgress {
  /** Checked answers plus skips. */
  attempts: number;
  /** Incorrect checked answers. */
  misses: number;
  /** Correct checked answers (independent or assisted). */
  correct: number;
  /** Independent correct presentations (first try, no help). */
  firstTryCorrect: number;
  /** Correct after a miss, Peek or Hint on that presentation. */
  assistedCorrect: number;
  /** "Skip for now" choices. */
  skips: number;
  /** Independent correct presentations since the last miss/assist/skip. */
  streak: number;
  /** Distinct local dates (YYYY-MM-DD) of the independent successes in the current streak. */
  streakDates: string[];
  /** Distinct local dates with any independent success (most recent kept). */
  successDates: string[];
  lastPracticedAt?: string;
}

export type WordStatus = 'untested' | 'practicing' | 'secure';
export type PracticeOutcome = 'independent-correct' | 'assisted-correct' | 'miss' | 'skip';

export const SECURE_STREAK = 2;
const MAX_DATES = 60;

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function emptyProgress(): WordProgress {
  return {
    attempts: 0, misses: 0, correct: 0, firstTryCorrect: 0, assistedCorrect: 0,
    skips: 0, streak: 0, streakDates: [], successDates: []
  };
}

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
const dateList = (value: unknown): string[] | null =>
  Array.isArray(value)
    ? [...new Set(value.filter((x): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)))].slice(-MAX_DATES)
    : null;

/**
 * Sanitize stored progress and fill fields that older (schema v1) saves lack.
 * A v1 word with no misses or helped answers keeps its first-try count as its
 * streak; any v1 miss or help means the streak must be rebuilt.
 */
export function normalizeProgress(raw: unknown): WordProgress {
  const value = (raw !== null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const base: WordProgress = {
    attempts: count(value.attempts),
    misses: count(value.misses),
    correct: count(value.correct),
    firstTryCorrect: count(value.firstTryCorrect),
    assistedCorrect: count(value.assistedCorrect),
    skips: count(value.skips),
    streak: 0,
    streakDates: [],
    successDates: []
  };
  if (typeof value.lastPracticedAt === 'string' && Number.isFinite(Date.parse(value.lastPracticedAt))) {
    base.lastPracticedAt = value.lastPracticedAt;
  }
  const legacyDate = base.lastPracticedAt ? [localDateKey(new Date(base.lastPracticedAt))] : [];
  if (typeof value.streak === 'number') {
    base.streak = Math.min(count(value.streak), base.firstTryCorrect);
  } else {
    base.streak = base.misses === 0 && base.assistedCorrect === 0 ? base.firstTryCorrect : 0;
  }
  base.streakDates = dateList(value.streakDates) ?? (base.streak > 0 ? legacyDate : []);
  if (base.streak === 0) base.streakDates = [];
  base.successDates = dateList(value.successDates) ?? (base.firstTryCorrect > 0 ? legacyDate : []);
  return base;
}

export function isSecure(progress?: unknown): boolean {
  return progress !== undefined && normalizeProgress(progress).streak >= SECURE_STREAK;
}

/** Secure, and the current streak's independent successes span 2+ calendar days. */
export function isSecureAcrossDays(progress?: unknown): boolean {
  if (progress === undefined) return false;
  const p = normalizeProgress(progress);
  return p.streak >= SECURE_STREAK && p.streakDates.length >= 2;
}

export function wordStatus(progress?: unknown): WordStatus {
  if (progress === undefined) return 'untested';
  const p = normalizeProgress(progress);
  if (p.attempts === 0) return 'untested';
  return p.streak >= SECURE_STREAK ? 'secure' : 'practicing';
}

/** Attempted but not secure: missed, helped, skipped or only one independent success. */
export function needsPractice(progress?: unknown): boolean {
  return progress !== undefined && normalizeProgress(progress).attempts > 0 && !isSecure(progress);
}

export function applyOutcome(progress: unknown, outcome: PracticeOutcome, now = new Date()): WordProgress {
  const p = normalizeProgress(progress);
  const today = localDateKey(now);
  const next: WordProgress = {
    ...p,
    streakDates: [...p.streakDates],
    successDates: [...p.successDates],
    attempts: p.attempts + 1,
    lastPracticedAt: now.toISOString()
  };
  switch (outcome) {
    case 'independent-correct':
      next.correct += 1;
      next.firstTryCorrect += 1;
      next.streak += 1;
      if (!next.streakDates.includes(today)) next.streakDates.push(today);
      if (!next.successDates.includes(today)) next.successDates.push(today);
      next.streakDates = next.streakDates.slice(-MAX_DATES);
      next.successDates = next.successDates.slice(-MAX_DATES);
      break;
    case 'assisted-correct':
      next.correct += 1;
      next.assistedCorrect += 1;
      next.streak = 0;
      next.streakDates = [];
      break;
    case 'miss':
      next.misses += 1;
      next.streak = 0;
      next.streakDates = [];
      break;
    case 'skip':
      next.skips += 1;
      next.streak = 0;
      next.streakDates = [];
      break;
  }
  return next;
}

export function lastPracticedTime(progress?: unknown): number {
  if (progress === undefined) return 0;
  const at = normalizeProgress(progress).lastPracticedAt;
  const time = at ? Date.parse(at) : 0;
  return Number.isFinite(time) ? time : 0;
}

/**
 * Practice urgency (higher = schedule sooner):
 * 3 recent trouble (attempted, streak 0) › 2 untested › 1 one independent success › 0 secure.
 */
export function weakness(progress?: unknown): number {
  if (progress === undefined) return 2;
  const p = normalizeProgress(progress);
  if (p.attempts === 0) return 2;
  if (p.streak >= SECURE_STREAK) return 0;
  return p.streak === 0 ? 3 : 1;
}
