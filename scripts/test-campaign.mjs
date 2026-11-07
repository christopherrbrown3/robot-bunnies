import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadTs } from './lib/load-ts.mjs';

const { createCampaignPlan, currentWeekNeedsFocus } = await loadTs('src/spelling/scheduler.ts');
const { persistSpellingData, saveWeek } = await loadTs('src/spelling/store.ts');
const {
  getOrStartCampaign, markCampaignLevelComplete, prioritizeCurrentWeek, clearCampaign,
  resolveCampaignPrompt, saveLevelProgress, coveredCurrentWords, CAMPAIGN_LEVEL_COUNT, ADDED_LEVEL_INDEXES
} = await loadTs('src/spelling/campaign.ts');

const levels = JSON.parse(readFileSync(new URL('../src/content/levels.json', import.meta.url), 'utf8'));
const N = levels.length;
assert.equal(CAMPAIGN_LEVEL_COUNT, N, 'campaign length matches levels.json');

const memory = new Map();
globalThis.localStorage = {
  getItem(key) { return memory.get(key) ?? null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};

function fixture(count, previousCount) {
  const current = {
    id: 'current', label: 'This week',
    words: Array.from({ length: count }, (_, i) => `currentword${String.fromCharCode(97+i)}`),
    progress: {}, createdAt: '2026-11-01T00:00:00.000Z'
  };
  const earlier = {
    id: 'earlier', label: 'Last week',
    words: Array.from({ length: previousCount }, (_, i) => `olderword${String.fromCharCode(97+i)}`),
    progress: {}, createdAt: '2026-10-25T00:00:00.000Z'
  };
  return { schemaVersion: 2, activeWeekId: 'current', weeks: previousCount ? [current, earlier] : [current] };
}

for (const count of [1, 2, 10, 11, 15, 19, 20]) {
  for (const oldCount of [0, 2, 20]) {
    const data = fixture(count, oldCount);
    for (const run of [0, 1, 5, 20]) {
      const plan = createCampaignPlan(data, run);
      assert.equal(plan.length, N, 'one step for every level');
      assert.deepEqual(plan.map(step => step.levelId), Array.from({ length: N }, (_, i) => i + 1));
      const currentWords = new Set(plan.filter(step => step.source === 'current').map(step => step.word));
      for (const word of data.weeks[0].words) assert.ok(currentWords.has(word), `missing ${word}`);
      const old = plan.filter(step => step.source === 'previous');
      assert.equal(old.length, 0, 'untested current words block previous-week reviews');
      assert.ok(old.length <= 4, 'prior weeks should not dominate');
      assert.ok(old.length <= N - count, 'prior weeks use only spare slots');
      assert.ok(old.every(step => step.weekId === 'earlier'), 'review words must use original history');
      assert.equal(new Set(plan.map(step => step.levelId)).size, N);
      assert.deepEqual(plan, createCampaignPlan(data, run), 'plan deterministic for current progress and run');
    }
  }
}

function confidentFixture(count = 10, oldCount = 10) {
  const data = fixture(count, oldCount);
  for (const word of data.weeks[0].words) {
    data.weeks[0].progress[word] = {
      attempts: 2, misses: 0, correct: 2, firstTryCorrect: 2, assistedCorrect: 0,
      skips: 0, streak: 2, streakDates: ['2026-11-01'], successDates: ['2026-11-01']
    };
  }
  return data;
}
const confident = confidentFixture();
assert.equal(currentWeekNeedsFocus(confident.weeks[0]), false);
assert.ok(createCampaignPlan(confident).some(step => step.source === 'previous'),
  'older words appear only when active list is comfortable');

const needsWork = confidentFixture();
needsWork.weeks[0].progress[needsWork.weeks[0].words[0]].misses = 1;
needsWork.weeks[0].progress[needsWork.weeks[0].words[0]].streak = 0;
needsWork.weeks[0].progress[needsWork.weeks[0].words[0]].streakDates = [];
assert.equal(currentWeekNeedsFocus(needsWork.weeks[0]), true);
assert.equal(createCampaignPlan(needsWork).filter(step => step.source === 'previous').length, 0);

persistSpellingData(confident);
clearCampaign();
let prioritized = getOrStartCampaign();
const firstOldIndex = prioritized.steps.findIndex(step => step.source === 'previous');
assert.ok(firstOldIndex >= 0);
for (let i = 0; i < firstOldIndex; i++) prioritized = markCampaignLevelComplete(prioritized, i);
persistSpellingData(needsWork);
prioritized = prioritizeCurrentWeek(prioritized, firstOldIndex);
assert.equal(prioritized.steps[firstOldIndex].source, 'current',
  'new misses redirect an upcoming old-week stage');
assert.equal(getOrStartCampaign().steps[firstOldIndex].source, 'current',
  'redirected word survives a reload');

// A run started with difficult words may later qualify for old-week review.
const changedMidrun = fixture(10, 10);
persistSpellingData(changedMidrun);
clearCampaign();
let improvedRun = getOrStartCampaign();
const firstSpare = improvedRun.steps.findIndex(s => s.optional);
assert.ok(firstSpare >= 0);
for (let i = 0; i < firstSpare; i++) improvedRun = markCampaignLevelComplete(improvedRun, i);
const nowFluent = confidentFixture(10, 10);
persistSpellingData(nowFluent);
improvedRun = prioritizeCurrentWeek(improvedRun, firstSpare);
assert.equal(improvedRun.steps[firstSpare].source, 'previous',
  'old-week reinforcement becomes available as soon as the current list is secure');
assert.equal(getOrStartCampaign().steps[firstSpare].source, 'previous',
  'newly chosen old-week word survives reopening');


const realData = {
  schemaVersion: 2,
  activeWeekId: 'current',
  weeks: [{
    id: 'current', label: 'Week one',
    words: ['ship', 'happy', 'rabbit', 'flower', 'jump', 'moon', 'star', 'king', 'blue', 'pink'],
    progress: {}, createdAt: new Date().toISOString()
  }]
};
persistSpellingData(realData);
clearCampaign();
let campaign = getOrStartCampaign();
assert.equal(campaign.nextLevelIndex, 0);
assert.equal(campaign.steps.length, N);
// In-level save: the prompt is resolved and saved before the portal is reached.
campaign = resolveCampaignPrompt(campaign, 0, 'independent');
assert.equal(getOrStartCampaign().level.promptResolved, true, 'resolved prompt survives reload');
assert.equal(resolveCampaignPrompt(campaign, 0, 'skipped').results[0], 'independent', 'resolving twice keeps the first result');
campaign = saveLevelProgress(campaign, 0, { checkpointX: 1800, flowers: 4, collected: ['f1', 'f2', 'f2'] });
const reloaded = getOrStartCampaign();
assert.equal(reloaded.level.checkpointX, 1800, 'checkpoint survives reload');
assert.deepEqual(reloaded.level.collected, ['f1', 'f2'], 'collected objects are not double-counted');
assert.ok(coveredCurrentWords(reloaded).includes(reloaded.steps[0].word), 'resolved word counts as covered in this run');
campaign = markCampaignLevelComplete(campaign, 0);
assert.equal(getOrStartCampaign().nextLevelIndex, 1, 'resumes the level after last completed');
assert.equal(getOrStartCampaign().totalFlowers, 4, 'level flowers bank at the portal');
assert.equal(getOrStartCampaign().level, null, 'next level starts without stale checkpoint');
assert.throws(() => markCampaignLevelComplete(campaign, 0), /active word list changed/i, 'no double-advances');
for (let i = 1; i < N; i++) campaign = markCampaignLevelComplete(campaign, i);
const next = getOrStartCampaign();
assert.equal(next.nextLevelIndex, 0, 'new run starts after every level is complete');
assert.equal(next.runNumber, 1, 'run number advances on replay');
saveWeek('Week one edited', ['ship', 'cat', 'rabbit'], 'current');
const changed = getOrStartCampaign();
assert.equal(changed.nextLevelIndex, 0, 'changing weekly words starts a new plan');
assert.ok(changed.steps.some(step => step.word === 'cat'));

// A run saved before the Christmas level (Level 12) was added is migrated, not thrown away.
const XMAS = ADDED_LEVEL_INDEXES[ADDED_LEVEL_INDEXES.length - 1];
assert.equal(levels[XMAS].play.scene, 'christmas', 'the newest added level is the Christmas level');
function legacyRun(nextLevelIndex, level = null) {
  persistSpellingData(realData);
  clearCampaign();
  const fresh = getOrStartCampaign();
  assert.ok(fresh.steps[XMAS].optional, 'fixture: the removed step is a spare one');
  const steps = fresh.steps.filter((_, i) => i !== XMAS).map((step, i) => ({ ...step, levelId: i + 1 }));
  const results = steps.map((_, i) => (i < nextLevelIndex ? 'independent' : null));
  const old = { ...fresh, steps, results, nextLevelIndex, level, totalFlowers: 40 };
  localStorage.setItem('robot-bunnies.campaign.v2', JSON.stringify(old));
  return old;
}
const STORE = 'robot-bunnies.campaign.v2';

let old = legacyRun(5);
let migrated = getOrStartCampaign();
assert.equal(migrated.steps.length, N, 'migrated run has a step for every level');
assert.deepEqual(migrated.steps.map(s => s.levelId), Array.from({ length: N }, (_, i) => i + 1));
assert.equal(migrated.nextLevelIndex, 5, 'progress before the new level is unchanged');
assert.equal(migrated.runNumber, old.runNumber, 'the same run continues');
assert.equal(migrated.totalFlowers, 40, 'flowers are kept');
assert.ok(migrated.steps[XMAS].optional && migrated.steps[XMAS].source === 'current', 'the new level gets a spare current-week word');
assert.deepEqual(migrated.steps[XMAS + 1], { ...old.steps[XMAS], levelId: XMAS + 2 }, 'later levels keep their words');
assert.equal(JSON.parse(localStorage.getItem(STORE)).steps.length, N, 'the migrated run is saved');

old = legacyRun(XMAS);
migrated = getOrStartCampaign();
assert.equal(migrated.nextLevelIndex, XMAS, 'a player about to start old Level 12 plays the Christmas level next');
assert.equal(migrated.results[XMAS], null);

old = legacyRun(XMAS, { levelIndex: XMAS, promptResolved: true, checkpointX: 2600, flowers: 7, collected: ['f1'], flags: ['h0-gone'] });
migrated = getOrStartCampaign();
assert.equal(migrated.nextLevelIndex, XMAS + 1, 'a player partway through the Helping Hand Hall stays there');
assert.equal(migrated.level.levelIndex, XMAS + 1);
assert.equal(migrated.level.checkpointX, 2600, 'their checkpoint is kept (the layout did not change)');
assert.equal(migrated.level.promptResolved, true);

old = legacyRun(15);
migrated = getOrStartCampaign();
assert.equal(migrated.nextLevelIndex, 16, 'later progress moves up one level');
assert.deepEqual(migrated.results.slice(0, XMAS), old.results.slice(0, XMAS), 'earlier results kept');
assert.equal(migrated.results[XMAS], null, 'the new level was not played in this run');
assert.deepEqual(migrated.results.slice(XMAS + 1), old.results.slice(XMAS), 'later results kept, one level later');

old = legacyRun(N - 1);
migrated = getOrStartCampaign();
assert.equal(migrated.runNumber, old.runNumber + 1, 'a finished 22-level run counts as finished: the next play starts a new run');
assert.equal(migrated.nextLevelIndex, 0);

console.log('Passed: campaign covers every weekly word, adapts to list lengths, reviews history, and resumes.');
