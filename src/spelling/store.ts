/** Local-only spelling lists. No child progress is ever sent to GitHub or a server. */
import { applyOutcome, normalizeProgress, type PracticeOutcome, type WordProgress } from './mastery';

export type { WordProgress } from './mastery';

export const SPELLING_STORAGE_KEY = 'robot-bunnies.spelling.v1';
/** Every campaign save key, current and legacy; cleared when lists are replaced or erased. */
export const CAMPAIGN_STORAGE_KEYS = ['robot-bunnies.campaign.v1', 'robot-bunnies.campaign.v2'];
export const MAX_WEEKLY_WORDS = 20;
export const SCHEMA_VERSION = 2;

export interface SpellingWeek {
  id: string;
  label: string;
  words: string[];
  progress: Record<string, WordProgress>;
  createdAt: string;
}

export interface SpellingData {
  schemaVersion: 2;
  activeWeekId: string | null;
  weeks: SpellingWeek[];
}

const empty = (): SpellingData => ({ schemaVersion: 2, activeWeekId: null, weeks: [] });
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

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
    progress[word] = normalizeProgress(stat);
  }
  return { id: item.id, label: item.label, words, progress, createdAt: item.createdAt };
}

/** Accepts schema v1 (prototype) and v2 data; always returns v2. */
export function validateSpellingData(input: unknown): SpellingData {
  if (!isObject(input) || (input.schemaVersion !== 1 && input.schemaVersion !== 2) ||
      !Array.isArray(input.weeks) || input.weeks.length > 156 ||
      !(input.activeWeekId === null || typeof input.activeWeekId === 'string')) {
    throw new Error('This is not a supported Robot Bunnies spelling backup.');
  }
  const weeks = input.weeks.map(validateWeek);
  if (new Set(weeks.map(w => w.id)).size !== weeks.length ||
      (input.activeWeekId !== null && !weeks.some(w => w.id === input.activeWeekId))) {
    throw new Error('This spelling backup has duplicate or missing week IDs.');
  }
  return { schemaVersion: 2, activeWeekId: input.activeWeekId, weeks };
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

/** Characters other than a–z that appear in any saved word (space, apostrophe, hyphen). */
export function punctuationInLists(data = loadSpellingData()): string[] {
  const found = new Set<string>();
  for (const week of data.weeks) {
    for (const word of week.words) {
      for (const ch of word) if (!/[a-z]/.test(ch)) found.add(ch);
    }
  }
  return [...found].sort();
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

/**
 * Record one practice event against the word's SOURCE week, so a previous-week
 * review updates that week's history rather than the current list.
 */
export function recordSpellingOutcome(weekId: string, word: string, outcome: PracticeOutcome, now = new Date()): void {
  const data = loadSpellingData();
  const week = data.weeks.find(w => w.id === weekId);
  if (!week || !week.words.includes(word)) return;
  week.progress[word] = applyOutcome(week.progress[word], outcome, now);
  persistSpellingData(data);
}

export function exportSpellingBackup(): string {
  return JSON.stringify(loadSpellingData(), null, 2);
}

export function importSpellingBackup(content: string): void {
  const parsed: unknown = JSON.parse(content);
  persistSpellingData(validateSpellingData(parsed));
  for (const key of CAMPAIGN_STORAGE_KEYS) localStorage.removeItem(key);
}

export function eraseSpellingData(): void {
  localStorage.removeItem(SPELLING_STORAGE_KEY);
  for (const key of CAMPAIGN_STORAGE_KEYS) localStorage.removeItem(key);
}
