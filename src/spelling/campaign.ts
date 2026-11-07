import {
  CAMPAIGN_LEVELS, createCampaignPlan, currentWeekNeedsFocus, selectCurrentFocusWord, selectPreviousReviewWord,
  type CampaignStep
} from './scheduler';
import { CAMPAIGN_STORAGE_KEYS, loadSpellingData, type SpellingData } from './store';

const STORAGE_KEY = 'robot-bunnies.campaign.v2';
export const CAMPAIGN_LEVEL_COUNT = CAMPAIGN_LEVELS;

/**
 * Levels added to the adventure after release, oldest first, as the index each
 * one was inserted at. A run saved before an addition is migrated when loaded
 * (see migrateRun), so nobody loses an adventure in progress.
 */
export const ADDED_LEVEL_INDEXES: readonly number[] = [
  11 // Level 12, "A Very Bunny Christmas" (November 2026): the original 22 levels became 23.
];

export type PromptResult = 'independent' | 'assisted' | 'skipped';

/** In-level save: checkpoint and the level's single spelling prompt. */
export interface LevelProgress {
  levelIndex: number;
  /** The level's spelling prompt was answered or skipped; never present it again on resume. */
  promptResolved: boolean;
  /** World x of the last checkpoint passed, or null for the level start. */
  checkpointX: number | null;
  /** Flowers collected so far in this level (kept across checkpoint resumes). */
  flowers: number;
  /** IDs of collected one-off objects (flowers, beads) so a resume never double-counts them. */
  collected: string[];
  /** Level-local story state, e.g. 'tiger-gone'. */
  flags: string[];
}

export interface SavedCampaign {
  schemaVersion: 2;
  activeWeekId: string;
  wordListSignature: string;
  runNumber: number;
  /** The level being played (or next to play). CAMPAIGN_LEVEL_COUNT means the run is complete. */
  nextLevelIndex: number;
  steps: CampaignStep[];
  startedAt: string;
  /** Outcome of each level's prompt in this run. */
  results: Array<PromptResult | null>;
  totalFlowers: number;
  level: LevelProgress | null;
  /** Run-wide story state, e.g. 'bow' once Lyla finds her bow. */
  flags: string[];
}

export function campaignSignature(data: SpellingData): string {
  // Changes to any word list invalidate a plan that references those lists.
  return JSON.stringify({
    activeWeekId: data.activeWeekId,
    weeks: data.weeks.map(week => ({ id: week.id, words: week.words }))
  });
}

const isStringArray = (value: unknown, max: number): value is string[] =>
  Array.isArray(value) && value.length <= max && value.every(x => typeof x === 'string' && x.length <= 64);
const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

function validLevel(value: unknown, nextLevelIndex: number): value is LevelProgress {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const level = value as Partial<LevelProgress>;
  return level.levelIndex === nextLevelIndex && typeof level.promptResolved === 'boolean' &&
    (level.checkpointX === null || (typeof level.checkpointX === 'number' && Number.isFinite(level.checkpointX) && level.checkpointX >= 0)) &&
    isCount(level.flowers) && isStringArray(level.collected, 500) && isStringArray(level.flags, 50);
}

function validSavedPlan(input: unknown, data: SpellingData): input is SavedCampaign {
  if (input === null || typeof input !== 'object') return false;
  const value = input as Partial<SavedCampaign>;
  if (value.schemaVersion !== 2 || value.activeWeekId !== data.activeWeekId ||
      value.wordListSignature !== campaignSignature(data) ||
      !Number.isInteger(value.nextLevelIndex) || (value.nextLevelIndex ?? -1) < 0 ||
      (value.nextLevelIndex ?? CAMPAIGN_LEVEL_COUNT + 1) > CAMPAIGN_LEVEL_COUNT ||
      !Number.isSafeInteger(value.runNumber) || (value.runNumber ?? -1) < 0 ||
      !Array.isArray(value.steps) || value.steps.length !== CAMPAIGN_LEVEL_COUNT ||
      !Array.isArray(value.results) || value.results.length !== CAMPAIGN_LEVEL_COUNT ||
      !value.results.every(r => r === null || r === 'independent' || r === 'assisted' || r === 'skipped') ||
      !isCount(value.totalFlowers) || !isStringArray(value.flags, 50) ||
      !validLevel(value.level ?? null, value.nextLevelIndex as number)) return false;
  const current = data.weeks.find(week => week.id === data.activeWeekId);
  if (!current) return false;
  const encountered = new Set<string>();
  for (let i = 0; i < CAMPAIGN_LEVEL_COUNT; i++) {
    const step = value.steps[i];
    if (!step || step.levelId !== i + 1 ||
        (step.source !== 'current' && step.source !== 'previous') ||
        typeof step.word !== 'string' || typeof step.weekId !== 'string' ||
        (step.optional !== undefined && typeof step.optional !== 'boolean')) return false;
    const source = data.weeks.find(week => week.id === step.weekId);
    if (!source?.words.includes(step.word)) return false;
    if (step.source === 'current') {
      if (step.weekId !== current.id) return false;
      encountered.add(step.word);
    } else if (step.weekId === current.id) return false;
  }
  return current.words.every(word => encountered.has(word));
}

/**
 * Insert a spare spelling step for a newly added level at `index`. Finished
 * levels keep their results. A player who has not reached the new level yet
 * will play it when they get there; one already partway through the level now
 * after it keeps their place there (and their checkpoint) instead.
 */
function insertLevel(run: SavedCampaign, index: number, data: SpellingData): SavedCampaign {
  const current = data.weeks.find(week => week.id === run.activeWeekId);
  const words = current?.words ?? [];
  if (!current || !words.length) return run;
  const spare: CampaignStep = {
    levelId: index + 1, weekId: current.id,
    word: words[(index + run.runNumber) % words.length],
    source: 'current', optional: true
  };
  const steps = [...run.steps];
  steps.splice(index, 0, spare);
  const results = [...run.results];
  results.splice(index, 0, null);
  const level = run.level ?? null;
  const shift = run.nextLevelIndex > index || (run.nextLevelIndex === index && level !== null);
  return {
    ...run,
    steps: steps.map((step, i) => ({ ...step, levelId: i + 1 })),
    results,
    nextLevelIndex: shift ? run.nextLevelIndex + 1 : run.nextLevelIndex,
    level: level && shift ? { ...level, levelIndex: level.levelIndex + 1 } : level
  };
}

/** Bring a run saved before one or more levels were added up to the current level count. */
function migrateRun(input: unknown, data: SpellingData): unknown {
  if (input === null || typeof input !== 'object') return input;
  const run = input as SavedCampaign;
  if (!Array.isArray(run.steps) || !Array.isArray(run.results) || run.steps.length !== run.results.length ||
      !Number.isInteger(run.nextLevelIndex) || !Number.isSafeInteger(run.runNumber)) return input;
  const missing = CAMPAIGN_LEVEL_COUNT - run.steps.length;
  if (missing <= 0 || missing > ADDED_LEVEL_INDEXES.length || run.nextLevelIndex > run.steps.length) return input;
  return ADDED_LEVEL_INDEXES.slice(-missing).reduce((migrated, index) => insertLevel(migrated, index, data), run);
}

function loadSaved(data: SpellingData): SavedCampaign | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as unknown;
    const parsed = migrateRun(stored, data);
    if (!validSavedPlan(parsed, data)) return null;
    const campaign = { ...parsed, level: parsed.level ?? null };
    if (parsed !== stored) store(campaign);
    return campaign;
  } catch {
    return null;
  }
}

function store(campaign: SavedCampaign): SavedCampaign {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  return campaign;
}

/** The saved run for the active list, without starting one (for menus and Parent Corner). */
export function peekCampaign(data = loadSpellingData()): SavedCampaign | null {
  return data.activeWeekId ? loadSaved(data) : null;
}

/** Continue from the last completed level, or begin a new full run. */
export function getOrStartCampaign(data = loadSpellingData()): SavedCampaign {
  if (!data.activeWeekId) throw new Error('Please add weekly spelling words in Parent Corner.');
  const existing = loadSaved(data);
  if (existing && existing.nextLevelIndex < CAMPAIGN_LEVEL_COUNT) return existing;
  const runNumber = existing ? existing.runNumber + 1 : 0;
  return store({
    schemaVersion: 2,
    activeWeekId: data.activeWeekId,
    wordListSignature: campaignSignature(data),
    runNumber,
    nextLevelIndex: 0,
    steps: createCampaignPlan(data, runNumber),
    startedAt: new Date().toISOString(),
    results: Array(CAMPAIGN_LEVEL_COUNT).fill(null),
    totalFlowers: 0,
    level: null,
    flags: []
  });
}

/** Load the stored run and confirm it is the same run and level the caller holds. */
function loadMatching(campaign: SavedCampaign, levelIndex: number, data = loadSpellingData()): SavedCampaign {
  const saved = loadSaved(data);
  if (!saved || saved.wordListSignature !== campaign.wordListSignature ||
      saved.runNumber !== campaign.runNumber || saved.nextLevelIndex !== levelIndex) {
    throw new Error('The active word list changed. Return to the game menu to continue.');
  }
  return saved;
}

function freshLevel(levelIndex: number): LevelProgress {
  return { levelIndex, promptResolved: false, checkpointX: null, flowers: 0, collected: [], flags: [] };
}

/**
 * At every spare stage, choose current-week practice if ANY current-week word
 * is not secure. Only if all are secure may a spare stage review an older
 * week's word. Previously visited stages never change, every active word's
 * guaranteed stage is preserved, and an already-resolved prompt is frozen.
 */
export function prioritizeCurrentWeek(campaign: SavedCampaign, levelIndex: number): SavedCampaign {
  const data = loadSpellingData();
  const saved = loadSaved(data);
  if (!saved || saved.runNumber !== campaign.runNumber ||
      saved.wordListSignature !== campaign.wordListSignature ||
      saved.nextLevelIndex !== levelIndex) {
    throw new Error('The active spelling adventure changed. Return to the game menu.');
  }
  const step = saved.steps[levelIndex];
  const current = data.weeks.find(week => week.id === saved.activeWeekId);
  if (!step || !step.optional || !current || saved.level?.promptResolved) return saved;

  let replacement: CampaignStep;
  if (currentWeekNeedsFocus(current)) {
    replacement = {
      levelId: levelIndex + 1, weekId: current.id,
      word: selectCurrentFocusWord(current, levelIndex),
      source: 'current', optional: true
    };
  } else {
    const spareCount = CAMPAIGN_LEVEL_COUNT - current.words.length;
    const previousQuota = Math.min(4, Math.ceil(spareCount / 3));
    const alreadyReviewed = saved.steps.slice(0, levelIndex)
      .filter(item => item.source === 'previous').length;
    const old = alreadyReviewed < previousQuota
      ? selectPreviousReviewWord(data, saved.runNumber, alreadyReviewed)
      : null;
    replacement = old
      ? { levelId: levelIndex + 1, weekId: old.weekId, word: old.word, source: 'previous', optional: true }
      : { levelId: levelIndex + 1, weekId: current.id,
          word: current.words[(levelIndex + saved.runNumber) % current.words.length],
          source: 'current', optional: true };
  }

  if (step.word === replacement.word && step.weekId === replacement.weekId) return saved;
  const steps = [...saved.steps];
  steps[levelIndex] = replacement;
  return store({ ...saved, steps });
}

/**
 * Save the level's spelling outcome immediately when it is resolved, before
 * any celebration. Idempotent: resolving twice keeps the first result, so a
 * reload can never double-score or re-present the prompt.
 */
export function resolveCampaignPrompt(campaign: SavedCampaign, levelIndex: number, result: PromptResult): SavedCampaign {
  const saved = loadMatching(campaign, levelIndex);
  if (saved.level?.promptResolved) return saved;
  const results = [...saved.results];
  results[levelIndex] = result;
  const level = { ...(saved.level ?? freshLevel(levelIndex)), promptResolved: true };
  return store({ ...saved, results, level });
}

/** Save a checkpoint / collected objects / level flags for the current level. */
export function saveLevelProgress(
  campaign: SavedCampaign,
  levelIndex: number,
  patch: Partial<Pick<LevelProgress, 'checkpointX' | 'flowers' | 'collected' | 'flags'>>
): SavedCampaign {
  const saved = loadMatching(campaign, levelIndex);
  const base = saved.level ?? freshLevel(levelIndex);
  const level: LevelProgress = {
    ...base,
    ...patch,
    collected: [...new Set(patch.collected ?? base.collected)].slice(-500),
    flags: [...new Set(patch.flags ?? base.flags)].slice(-50)
  };
  return store({ ...saved, level });
}

export function addCampaignFlag(campaign: SavedCampaign, levelIndex: number, flag: string): SavedCampaign {
  const saved = loadMatching(campaign, levelIndex);
  if (saved.flags.includes(flag)) return saved;
  return store({ ...saved, flags: [...saved.flags, flag] });
}

/**
 * Finish the level at its portal. Leaving immediately afterwards resumes at
 * the next level; finishing every level lets the next play start a fresh run.
 */
export function markCampaignLevelComplete(campaign: SavedCampaign, levelIndex: number, levelFlowers?: number): SavedCampaign {
  const saved = loadMatching(campaign, levelIndex);
  const flowers = Math.max(0, Math.floor(levelFlowers ?? saved.level?.flowers ?? 0));
  return store({
    ...saved,
    nextLevelIndex: Math.min(CAMPAIGN_LEVEL_COUNT, levelIndex + 1),
    totalFlowers: saved.totalFlowers + flowers,
    level: null
  });
}

/** Current-week words whose level prompt has been resolved in this run. */
export function coveredCurrentWords(campaign: SavedCampaign): string[] {
  const covered = new Set<string>();
  campaign.steps.forEach((step, i) => {
    if (step.source === 'current' && campaign.results[i] !== null) covered.add(step.word);
  });
  return [...covered];
}

export function clearCampaign(): void {
  for (const key of CAMPAIGN_STORAGE_KEYS) localStorage.removeItem(key);
}
