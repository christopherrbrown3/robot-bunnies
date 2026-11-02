import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const levels = JSON.parse(readFileSync(new URL('../src/content/levels.json', import.meta.url), 'utf8'));
assert.ok(Array.isArray(levels), 'levels must be an array');
assert.equal(levels.length, 22, 'Zoey specified exactly 22 levels');
const expected = new Set(Array.from({ length: 22 }, (_, i) => i + 1));
const seen = new Set();
for (const level of levels) {
  assert.ok(Number.isInteger(level.id), 'level IDs must be integers');
  assert.ok(expected.has(level.id), `unexpected level ID ${level.id}`);
  assert.ok(!seen.has(level.id), `duplicate level ID ${level.id}`);
  seen.add(level.id);
  for (const key of ['slug', 'title', 'setting', 'theme', 'story', 'mechanic', 'spellingChallenge']) {
    assert.equal(typeof level[key], 'string', `level ${level.id} missing ${key}`);
    assert.ok(level[key].trim().length > 0, `level ${level.id} empty ${key}`);
  }
  assert.ok(['confirmed-setting','confirmed-final','proposed'].includes(level.provenance), 'unrecognized provenance');
  assert.equal(level.slug, `level-${String(level.id).padStart(2, '0')}`, 'slug mismatch');
  const play = level.play;
  assert.ok(play && typeof play === 'object', `level ${level.id} missing play config`);
  assert.ok(['castle','rainbow','sky','garden','night','woodland','zoo','river','orchard','town','meadow','control','final'].includes(play.scene), `level ${level.id} unknown scene`);
  assert.ok(Number.isInteger(play.length) && play.length >= 3000 && play.length <= 12000, `level ${level.id} length`);
  for (const key of ['obstacles', 'platforms', 'beads', 'targets']) {
    assert.ok(Number.isInteger(play[key]) && play[key] >= 0 && play[key] <= 20, `level ${level.id} ${key}`);
  }
  assert.ok(Array.isArray(play.hazards) && play.hazards.every(h => ['tiger','monkey','hand'].includes(h.type) && h.at > 0.15 && h.at < 0.9), `level ${level.id} hazards`);
  const t = play.trigger;
  assert.ok(['cage','flower','gate','bow','phone','heart'].includes(t.kind), `level ${level.id} trigger kind`);
  assert.ok(t.at === 'start' || t.at === 'boss' || (typeof t.at === 'number' && t.at > 0.2 && t.at < 0.85), `level ${level.id} trigger position`);
  for (const key of ['title', 'story', 'success']) assert.ok(typeof t[key] === 'string' && t[key].length > 3, `level ${level.id} trigger ${key}`);
  assert.equal(level.developmentStatus, 'playable', `level ${level.id} should be playable`);
}
assert.equal(seen.size, 22);
assert.equal(levels[0].play.trigger.kind, 'cage', 'Level 1 starts in the cage (Bunny Police key)');
assert.ok(levels[0].play.hazards.some(h => h.type === 'tiger'), 'Level 1 has the ambushing tiger');
assert.equal(levels[1].play.scene, 'rainbow', 'Level 2 is inside a rainbow');
assert.ok(levels[21].play.boss && levels[21].play.trigger.kind === 'heart', 'Level 22 is the giant monster boss');
assert.ok(levels.some(l => l.play.hazards.some(h => h.type === 'monkey') && /zoo/i.test(l.setting)), 'a zoo level has jumping animals');
assert.ok(levels.some(l => l.play.beads > 0), 'beads to pick up');
assert.ok(levels.some(l => l.play.hazards.some(h => h.type === 'hand')), 'a hand obstacle');
assert.ok(levels.some(l => l.play.paintDoor !== undefined), 'rainbow paint doors');
assert.ok(levels.findIndex(l => l.play.trigger.kind === 'bow') < 21, 'the bow is found before the finale');
assert.match(levels[0].setting, /pink castle/i);
assert.match(levels[0].story, /Bunny Police/);
assert.match(levels[1].setting, /rainbow/i);
assert.match(levels[21].story, /giant monster/i);
assert.match(levels[21].story, /bow and arrows/i);
console.log('Valid: exactly 22 ordered, playable levels with canonical story anchors, hazards and spelling triggers.');
