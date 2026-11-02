// Every generated level layout is playable: reachable flowers, clear hazard
// zones, the spelling trigger before the portal, and deterministic output.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadTs } from './lib/load-ts.mjs';

const levels = JSON.parse(readFileSync(new URL('../src/content/levels.json', import.meta.url), 'utf8'));
const { buildLayout, GROUND_Y } = await loadTs('src/game/levelPlan.ts');

const JUMP_APEX = (760 ** 2) / (2 * 1500); // ≈192px: Lyla's single high jump
for (const level of levels) {
  const a = buildLayout(level);
  assert.deepEqual(a, buildLayout(level), `level ${level.id} layout must be deterministic`);
  assert.equal(a.obstacles.length, level.play.obstacles, `level ${level.id} placed every obstacle`);
  assert.equal(a.platforms.length, level.play.platforms, `level ${level.id} placed every platform`);
  assert.equal(a.beads.length, level.play.beads * 2, `level ${level.id} placed every bead pair`);
  assert.ok(a.trigger.x < a.portalX - 200, `level ${level.id}: spelling trigger comes before the portal`);
  for (const o of a.obstacles) {
    assert.ok(o.h <= 104 && o.h < JUMP_APEX - 60, `level ${level.id}: obstacle ${o.id} is jumpable`);
    for (const h of a.hazards) assert.ok(o.x + o.w < h.x - 600 || o.x > h.x + 280, `level ${level.id}: hazard ${h.id} zone is clear`);
    assert.ok(o.x + o.w < a.trigger.x - 280 || o.x > a.trigger.x + 300, `level ${level.id}: trigger zone is clear`);
  }
  for (const f of a.flowers) {
    assert.ok(f.y > GROUND_Y - JUMP_APEX - 70 && f.y < GROUND_Y, `level ${level.id}: flower ${f.id} reachable`);
    assert.ok(f.x > 0 && f.x < a.length, `level ${level.id}: flower ${f.id} inside the level`);
  }
  for (const p of a.platforms) assert.ok(GROUND_Y - p.y < JUMP_APEX - 20, `level ${level.id}: platform reachable`);
  assert.equal(new Set([...a.flowers, ...a.beads].map(c => c.id)).size, a.flowers.length + a.beads.length, `level ${level.id}: unique collectible IDs`);
  assert.ok(a.checkpoints.every(x => x > 700 && x < a.portalX), `level ${level.id}: checkpoints on the path`);
}
console.log(`Passed: ${levels.length} level layouts are deterministic, jumpable, and keep hazard and spelling zones clear.`);
