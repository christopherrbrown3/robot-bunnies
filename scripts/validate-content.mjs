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
}
assert.equal(seen.size, 22);
assert.match(levels[0].setting, /pink castle/i);
assert.match(levels[0].story, /Bunny Police/);
assert.match(levels[1].setting, /rainbow/i);
assert.match(levels[21].story, /giant monster/i);
assert.match(levels[21].story, /bow and arrows/i);
console.log('Valid: exactly 22 ordered levels with canonical story anchors and spelling fields.');
