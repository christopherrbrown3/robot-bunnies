// Acceptance criteria 2 and 4 from docs/FINAL_SPEC.md §9, plus v1 → v2 migration.
import assert from 'node:assert/strict';
import { loadTs } from './lib/load-ts.mjs';

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key)
};

const { applyOutcome, emptyProgress, isSecure, isSecureAcrossDays, wordStatus, normalizeProgress } =
  await loadTs('src/spelling/mastery.ts');
const { persistSpellingData, loadSpellingData, recordSpellingOutcome, validateSpellingData } =
  await loadTs('src/spelling/store.ts');
const { getOrStartCampaign, markCampaignLevelComplete, prioritizeCurrentWeek, clearCampaign } =
  await loadTs('src/spelling/campaign.ts');

const monday = new Date(2026, 10, 2, 16, 0);
const mondayLater = new Date(2026, 10, 2, 18, 0);
const tuesday = new Date(2026, 10, 3, 16, 0);

// --- Criterion 4: mastery thresholds -------------------------------------
let p = emptyProgress();
assert.equal(wordStatus(p), 'untested');
p = applyOutcome(p, 'independent-correct', monday);
assert.equal(wordStatus(p), 'practicing', '1 independent success → still weak');
assert.equal(isSecure(p), false);
p = applyOutcome(p, 'independent-correct', mondayLater);
assert.equal(isSecure(p), true, '2 independent successes the same day → secure');
assert.equal(isSecureAcrossDays(p), false, 'same-day streak is not cross-day evidence');
p = applyOutcome(p, 'miss', tuesday);
assert.equal(isSecure(p), false, 'new miss → weak');
p = applyOutcome(p, 'independent-correct', tuesday);
assert.equal(isSecure(p), false, 'one fresh success is not enough');
p = applyOutcome(p, 'independent-correct', new Date(2026, 10, 4, 9));
assert.equal(isSecure(p), true, '2 fresh independent successes → secure again');
assert.equal(isSecureAcrossDays(p), true, 'distinct dates are tracked');
for (const outcome of ['assisted-correct', 'skip']) {
  const regressed = applyOutcome(p, outcome, tuesday);
  assert.equal(isSecure(regressed), false, `${outcome} → weak`);
  assert.equal(regressed.streak, 0);
}
assert.equal(p.firstTryCorrect, 4);
assert.equal(p.misses, 1);

// Same-day, no waiting: two different-day successes are preferred, never required.
let sameDay = applyOutcome(applyOutcome(emptyProgress(), 'independent-correct', monday), 'independent-correct', monday);
assert.equal(isSecure(sameDay), true);

// --- Migration: schema v1 prototype data ---------------------------------
const v1 = {
  schemaVersion: 1, activeWeekId: 'w',
  weeks: [{ id: 'w', label: 'Old', words: ['cat', 'dog', 'sun'], createdAt: '2026-10-01T00:00:00.000Z',
    progress: {
      cat: { attempts: 2, misses: 0, correct: 2, firstTryCorrect: 2, assistedCorrect: 0, lastPracticedAt: '2026-10-02T10:00:00.000Z' },
      dog: { attempts: 3, misses: 1, correct: 2, firstTryCorrect: 2, assistedCorrect: 0 },
      sun: { attempts: 1, misses: 0, correct: 1, firstTryCorrect: 1, assistedCorrect: 0 }
    } }]
};
const migrated = validateSpellingData(v1);
assert.equal(migrated.schemaVersion, 2);
assert.equal(isSecure(migrated.weeks[0].progress.cat), true, 'clean v1 history keeps its streak');
assert.equal(isSecure(migrated.weeks[0].progress.dog), false, 'v1 misses must be rebuilt');
assert.equal(migrated.weeks[0].progress.sun.streak, 1);
assert.equal(normalizeProgress({ streak: 9, firstTryCorrect: 1 }).streak, 1, 'streak cannot exceed independent successes');

// --- Criterion 2: regression redirects the next spare level --------------
const secure = () => ({
  attempts: 2, misses: 0, correct: 2, firstTryCorrect: 2, assistedCorrect: 0, skips: 0,
  streak: 2, streakDates: ['2026-11-01', '2026-11-02'], successDates: ['2026-11-01', '2026-11-02']
});
const words = Array.from({ length: 10 }, (_, i) => `word${String.fromCharCode(97 + i)}`);
const data = {
  schemaVersion: 2, activeWeekId: 'now',
  weeks: [
    { id: 'now', label: 'This week', words, createdAt: '2026-11-01T00:00:00.000Z',
      progress: Object.fromEntries(words.map(w => [w, secure()])) },
    { id: 'old', label: 'Last week', words: ['apple', 'bunny', 'river', 'storm', 'tiger'],
      createdAt: '2026-10-25T00:00:00.000Z', progress: {} }
  ]
};
for (const outcome of ['miss', 'assisted-correct', 'skip']) {
  persistSpellingData(structuredClone(data));
  clearCampaign();
  let run = getOrStartCampaign();
  const oldIndex = run.steps.findIndex(step => step.source === 'previous');
  assert.ok(oldIndex > 0, 'a fully secure list schedules old-week review');
  for (let i = 0; i < oldIndex; i++) run = markCampaignLevelComplete(run, i);
  recordSpellingOutcome('now', 'wordc', outcome, tuesday);
  assert.equal(isSecure(loadSpellingData().weeks[0].progress.wordc), false);
  run = prioritizeCurrentWeek(run, oldIndex);
  assert.deepEqual([run.steps[oldIndex].source, run.steps[oldIndex].word], ['current', 'wordc'],
    `${outcome} on a secure current word replaces the next old-week review with that word`);
}

// Previous-week practice is recorded against the previous week.
persistSpellingData(structuredClone(data));
recordSpellingOutcome('old', 'tiger', 'independent-correct', tuesday);
assert.equal(loadSpellingData().weeks[1].progress.tiger.firstTryCorrect, 1);
assert.equal(loadSpellingData().weeks[0].progress.tiger, undefined);

console.log('Passed: two-independent-success mastery, regression, date evidence, v1 migration and source-week recording.');
