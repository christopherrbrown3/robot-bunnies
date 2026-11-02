import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function source(path) {
  return ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 }
  }).outputText;
}
function url(js) {
  return 'data:text/javascript;base64,' + Buffer.from(js).toString('base64');
}
const schedulerUrl = url(source('../src/spelling/scheduler.ts'));
const storeUrl = url(source('../src/spelling/store.ts'));
const campaignUrl = url(
  source('../src/spelling/campaign.ts')
    .replace(/from ['"]\.\/scheduler['"]/g, `from '${schedulerUrl}'`)
    .replace(/from ['"]\.\/store['"]/g, `from '${storeUrl}'`)
);
const { createCampaignPlan } = await import(schedulerUrl);
const { persistSpellingData, saveWeek } = await import(storeUrl);
const { getOrStartCampaign, markCampaignLevelComplete, clearCampaign } = await import(campaignUrl);

const memory = new Map();
globalThis.localStorage = {
  getItem(key) { return memory.get(key) ?? null; },
  setItem(key, value) { memory.set(key, value); },
  removeItem(key) { memory.delete(key); }
};

function fixture(count, previousCount) {
  const current = {
    id: 'current', label: 'This week',
    words: Array.from({ length: count }, (_, i) => `currentword${i}`),
    progress: {}, createdAt: '2026-11-01T00:00:00.000Z'
  };
  const earlier = {
    id: 'earlier', label: 'Last week',
    words: Array.from({ length: previousCount }, (_, i) => `olderword${i}`),
    progress: {}, createdAt: '2026-10-25T00:00:00.000Z'
  };
  return { schemaVersion: 1, activeWeekId: 'current', weeks: previousCount ? [current, earlier] : [current] };
}

for (const count of [1, 2, 10, 11, 15, 19, 20]) {
  for (const oldCount of [0, 2, 20]) {
    const data = fixture(count, oldCount);
    for (const run of [0, 1, 5, 20]) {
      const plan = createCampaignPlan(data, run);
      assert.equal(plan.length, 22, 'always exactly 22 levels');
      assert.deepEqual(plan.map(step => step.levelId), Array.from({ length: 22 }, (_, i) => i + 1));
      const currentWords = new Set(plan.filter(step => step.source === 'current').map(step => step.word));
      for (const word of data.weeks[0].words) assert.ok(currentWords.has(word), `missing ${word}`);
      const old = plan.filter(step => step.source === 'previous');
      assert.ok(old.length <= 4, 'prior weeks should not dominate');
      assert.ok(old.length <= 22 - count, 'prior weeks use only spare slots');
      assert.ok(old.every(step => step.weekId === 'earlier'), 'review words must use original history');
      assert.equal(new Set(plan.map(step => step.levelId)).size, 22);
      assert.deepEqual(plan, createCampaignPlan(data, run), 'plan deterministic for current progress and run');
    }
  }
}

const realData = {
  schemaVersion: 1,
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
assert.equal(campaign.steps.length, 22);
campaign = markCampaignLevelComplete(campaign, 0);
assert.equal(getOrStartCampaign().nextLevelIndex, 1, 'resumes the level after last completed');
assert.throws(() => markCampaignLevelComplete(campaign, 0), /active word list changed/i, 'no double-advances');
for (let i = 1; i < 22; i++) campaign = markCampaignLevelComplete(campaign, i);
const next = getOrStartCampaign();
assert.equal(next.nextLevelIndex, 0, 'new run starts after all 22 complete');
assert.equal(next.runNumber, 1, 'run number advances on replay');
saveWeek('Week one edited', ['ship', 'cat', 'rabbit'], 'current');
const changed = getOrStartCampaign();
assert.equal(changed.nextLevelIndex, 0, 'changing weekly words starts a new 22-stage plan');
assert.ok(changed.steps.some(step => step.word === 'cat'));

console.log('Passed: campaign covers every weekly word, adapts to list lengths, reviews history, and resumes.');
