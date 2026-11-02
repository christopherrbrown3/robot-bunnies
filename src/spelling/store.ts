/** Local-only spelling lists. No child progress is ever sent to GitHub or a server. */
export const SPELLING_STORAGE_KEY = 'robot-bunnies.spelling.v1';
export const MAX_WEEKLY_WORDS = 20;

export interface WordProgress {
  attempts: number;
  misses: number;
  correct: number;
  firstTryCorrect: number;
  assistedCorrect: number;
  lastPracticedAt?: string;
}

export interface SpellingWeek {
  id: string;
  label: string;
  words: string[];
  progress: Record<string, WordProgress>;
  createdAt: string;
}

export interface SpellingData {
  schemaVersion: 1;
  activeWeekId: string | null;
  weeks: SpellingWeek[];
}

const empty = (): SpellingData => ({ schemaVersion: 1, activeWeekId: null, weeks: [] });
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const nonnegative = (value: unknown): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

export function normalizeAnswer(input: string): string {
  return input.trim().replace(/\s+/g, ' ').replace(/[’‘]/g, "'").toLocaleLowerCase('en-US');
}

export function parseWords(input: string): string[] {
  const words = input
    .split(/[,\n\r]+/)
    .map(item => item.trim().replace(/^\d{1,2}[.)]\s*/, ''))
    .filter(Boolean)
    .map(normalizeAnswer);
  if (words.length > MAX_WEEKLY_WORDS) {
    throw new Error(`Each week can have up to ${MAX_WEEKLY_WORDS} words. You entered ${words.length}.`);
  }
  for (const word of words) {
    if (word.length > 40 || !/^[a-z]+(?:[ '-][a-z]+)*$/.test(word)) {
      throw new Error(`Please check "${word}". Use words with letters, spaces, hyphens or apostrophes (40 characters max).`);
    }
  }
  if (new Set(words).size !== words.length) {
    throw new Error('There are repeated words in this list. Please remove duplicates.');
  }
  if (!words.length) throw new Error('Add at least one spelling word before saving.');
  return words;
}

function validateWeek(item: unknown): SpellingWeek {
  if (!isObject(item) || typeof item.id !== 'string' || !item.id ||
      typeof item.label !== 'string' || item.label.trim().length < 1 || item.label.length > 60 ||
      !Array.isArray(item.words) || item.words.length > MAX_WEEKLY_WORDS ||
      !item.words.every(x => typeof x === 'string') ||
      typeof item.createdAt !== 'string' || !isObject(item.progress)) {
    throw new Error('The saved spelling data has an invalid weekly list.');
  }
  // Use the same word rules for edits and imported data, without silently changing spelling.
  const words = parseWords(item.words.join('\n'));
  if (JSON.stringify(words) !== JSON.stringify(item.words)) {
    throw new Error('A saved word list contains invalid or non-normalized words.');
  }
  const progress: Record<string, WordProgress> = {};
  for (const word of words) {
    const stat = item.progress[word];
    if (stat === undefined) continue;
    if (!isObject(stat)) throw new Error('Invalid word practice history.');
    progress[word] = {
      attempts: nonnegative(stat.attempts),
      misses: nonnegative(stat.misses),
      correct: nonnegative(stat.correct),
      firstTryCorrect: nonnegative(stat.firstTryCorrect),
      assistedCorrect: nonnegative(stat.assistedCorrect),
      ...(typeof stat.lastPracticedAt === 'string' ? { lastPracticedAt: stat.lastPracticedAt } : {})
    };
  }
  return { id: item.id, label: item.label, words, progress, createdAt: item.createdAt };
}

export function validateSpellingData(input: unknown): SpellingData {
  if (!isObject(input) || input.schemaVersion !== 1 || !Array.isArray(input.weeks) ||
      input.weeks.length > 156 || !(input.activeWeekId === null || typeof input.activeWeekId === 'string')) {
    throw new Error('This is not a supported Robot Bunnies spelling backup.');
  }
  const weeks = input.weeks.map(validateWeek);
  if (new Set(weeks.map(w => w.id)).size !== weeks.length ||
      (input.activeWeekId !== null && !weeks.some(w => w.id === input.activeWeekId))) {
    throw new Error('This spelling backup has duplicate or missing week IDs.');
  }
  return { schemaVersion: 1, activeWeekId: input.activeWeekId, weeks };
}

export function loadSpellingData(): SpellingData {
  const raw = localStorage.getItem(SPELLING_STORAGE_KEY);
  return raw ? validateSpellingData(JSON.parse(raw) as unknown) : empty();
}

export function persistSpellingData(data: SpellingData): void {
  const validated = validateSpellingData(data);
  localStorage.setItem(SPELLING_STORAGE_KEY, JSON.stringify(validated));
}

export function getActiveWeek(data = loadSpellingData()): SpellingWeek | null {
  return data.weeks.find(week => week.id === data.activeWeekId) ?? null;
}

export function getActiveSpellingWords(): string[] {
  return getActiveWeek()?.words ?? [];
}

/** Create or update a week; retain progress for any unchanged word. */
export function saveWeek(label: string, words: string[], existingId?: string): SpellingWeek {
  const name = label.trim();
  if (name.length === 0 || name.length > 60) throw new Error('Enter a week name (up to 60 characters).');
  const validatedWords = parseWords(words.join('\n'));
  const data = loadSpellingData();
  const existing = data.weeks.find(week => week.id === existingId);
  const week: SpellingWeek = {
    id: existing?.id ?? `week-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: name,
    words: validatedWords,
    progress: {},
    createdAt: existing?.createdAt ?? new Date().toISOString()
  };
  for (const word of validatedWords) {
    if (existing?.progress[word]) week.progress[word] = existing.progress[word];
  }
  if (existing) data.weeks[data.weeks.indexOf(existing)] = week;
  else {
    if (data.weeks.length >= 156) throw new Error('Week history is full. Export a backup before clearing older entries.');
    data.weeks.unshift(week);
  }
  data.activeWeekId = week.id;
  persistSpellingData(data);
  return week;
}

export function activateWeek(id: string): void {
  const data = loadSpellingData();
  if (!data.weeks.some(week => week.id === id)) throw new Error('That week was not found.');
  data.activeWeekId = id;
  persistSpellingData(data);
}

export function recordSpellingAttempt(weekId: string, word: string, correct: boolean, firstTry: boolean, assisted: boolean): void {
  const data = loadSpellingData();
  const week = data.weeks.find(w => w.id === weekId);
  if (!week || !week.words.includes(word)) return;
  const old = week.progress[word] ?? { attempts: 0, misses: 0, correct: 0, firstTryCorrect: 0, assistedCorrect: 0 };
  week.progress[word] = {
    attempts: old.attempts + 1,
    misses: old.misses + (correct ? 0 : 1),
    correct: old.correct + (correct ? 1 : 0),
    firstTryCorrect: old.firstTryCorrect + (correct && firstTry && !assisted ? 1 : 0),
    assistedCorrect: old.assistedCorrect + (correct && assisted ? 1 : 0),
    lastPracticedAt: new Date().toISOString()
  };
  persistSpellingData(data);
}

export function exportSpellingBackup(): string {
  return JSON.stringify(loadSpellingData(), null, 2);
}

export function importSpellingBackup(content: string): void {
  const parsed: unknown = JSON.parse(content);
  persistSpellingData(validateSpellingData(parsed));
}

export function eraseSpellingData(): void {
  localStorage.removeItem(SPELLING_STORAGE_KEY);
}
