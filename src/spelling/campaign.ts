import { createCampaignPlan, currentWeekNeedsFocus, selectCurrentFocusWord, type CampaignStep } from './scheduler';
import { loadSpellingData, type SpellingData } from './store';

const STORAGE_KEY = 'robot-bunnies.campaign.v1';
export const CAMPAIGN_LEVEL_COUNT = 22;

export interface SavedCampaign {
  schemaVersion: 1;
  activeWeekId: string;
  wordListSignature: string;
  runNumber: number;
  nextLevelIndex: number;
  steps: CampaignStep[];
  startedAt: string;
}

export function campaignSignature(data: SpellingData): string {
  // Changes to any word list invalidate a plan that references those lists.
  return JSON.stringify({
    activeWeekId: data.activeWeekId,
    weeks: data.weeks.map(week => ({ id: week.id, words: week.words }))
  });
}

function validSavedPlan(input: unknown, data: SpellingData): input is SavedCampaign {
  if (input === null || typeof input !== 'object') return false;
  const value = input as Partial<SavedCampaign>;
  if (value.schemaVersion !== 1 || value.activeWeekId !== data.activeWeekId ||
      value.wordListSignature !== campaignSignature(data) ||
      !Number.isInteger(value.nextLevelIndex) || (value.nextLevelIndex ?? -1) < 0 ||
      (value.nextLevelIndex ?? 23) > CAMPAIGN_LEVEL_COUNT ||
      !Number.isSafeInteger(value.runNumber) || (value.runNumber ?? -1) < 0 ||
      !Array.isArray(value.steps) || value.steps.length !== CAMPAIGN_LEVEL_COUNT) return false;
  const current = data.weeks.find(week => week.id === data.activeWeekId);
  if (!current) return false;
  const encountered = new Set<string>();
  for (let i = 0; i < CAMPAIGN_LEVEL_COUNT; i++) {
    const step = value.steps[i];
    if (!step || step.levelId !== i + 1 ||
        (step.source !== 'current' && step.source !== 'previous') ||
        typeof step.word !== 'string' || typeof step.weekId !== 'string') return false;
    const source = data.weeks.find(week => week.id === step.weekId);
    if (!source?.words.includes(step.word)) return false;
    if (step.source === 'current') {
      if (step.weekId !== current.id) return false;
      encountered.add(step.word);
    } else if (step.weekId === current.id) return false;
  }
  return current.words.every(word => encountered.has(word));
}

function loadSaved(data: SpellingData): SavedCampaign | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw && validSavedPlan(JSON.parse(raw) as unknown, data)
      ? JSON.parse(raw) as SavedCampaign : null;
  } catch {
    return null;
  }
}

/** Continue from the last completed level, or begin a new 22-level run. */
export function getOrStartCampaign(data = loadSpellingData()): SavedCampaign {
  if (!data.activeWeekId) throw new Error('Please add weekly spelling words in Parent Corner.');
  const existing = loadSaved(data);
  if (existing && existing.nextLevelIndex < CAMPAIGN_LEVEL_COUNT) return existing;
  const runNumber = existing ? existing.runNumber + 1 : 0;
  const current: SavedCampaign = {
    schemaVersion: 1,
    activeWeekId: data.activeWeekId,
    wordListSignature: campaignSignature(data),
    runNumber,
    nextLevelIndex: 0,
    steps: createCampaignPlan(data, runNumber),
    startedAt: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return current;
}

/**
 * Enforce active-list priority again at level entry: if a current word became
 * weak during the run, convert the next planned older-week reinforcement
 * stage into a current-week practice stage. Preserve all completed stages.
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
  if (!step || step.source !== 'previous' || !current || !currentWeekNeedsFocus(current)) {
    return saved;
  }
  const word = selectCurrentFocusWord(current, levelIndex);
  const steps = [...saved.steps];
  steps[levelIndex] = { levelId: levelIndex + 1, weekId: current.id, word, source: 'current' };
  const updated = { ...saved, steps };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

/**
 * Save the completed prompt before showing the Next button. Leaving the app
 * immediately after answering correctly does not replay that cleared level.
 */
export function markCampaignLevelComplete(campaign: SavedCampaign, levelIndex: number): SavedCampaign {
  const data = loadSpellingData();
  const saved = loadSaved(data);
  if (!saved || saved.wordListSignature !== campaign.wordListSignature ||
      saved.runNumber !== campaign.runNumber || saved.nextLevelIndex !== levelIndex) {
    throw new Error('The active word list changed. Return to the game menu to continue.');
  }
  const updated = { ...saved, nextLevelIndex: Math.min(CAMPAIGN_LEVEL_COUNT, levelIndex + 1) };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearCampaign(): void {
  localStorage.removeItem(STORAGE_KEY);
}
