/**
 * Deterministic level layouts generated from levels.json `play` parameters.
 * The same level always looks the same (seeded by its layout seed, normally
 * the level id), so a saved checkpoint x and collected-object IDs stay
 * meaningful after a reload.
 *
 * Platforming is deliberately easy: no pits, no lives, wide spacing,
 * obstacles you can land on, and hazards placed in clear zones so the
 * "tap Lyla to shrink" moment is the only thing happening.
 */
import type { HazardType, LevelOutline, TriggerKind } from '../content/types';

export const GROUND_Y = 470;
export const LYLA_START_X = 170;

export interface Obstacle { id: string; x: number; w: number; h: number }
export interface Platform { x: number; y: number; w: number }
export interface Collectible { id: string; x: number; y: number }
export interface Hazard { id: string; type: HazardType; x: number }

export interface LevelLayout {
  length: number;
  obstacles: Obstacle[];
  platforms: Platform[];
  flowers: Collectible[];
  beads: Collectible[];
  hazards: Hazard[];
  checkpoints: number[];
  trigger: { kind: TriggerKind; x: number };
  paintDoorX: number | null;
  targets: Collectible[];
  portalX: number;
  arenaX: number | null;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Span = [number, number];

function overlaps(a: Span, b: Span): boolean {
  return a[0] < b[1] && b[0] < a[1];
}

/** Open stretches of ground between `from` and `to`, avoiding blocked spans (shrunk by `margin`). */
export function freeIntervals(from: number, to: number, blocked: Span[], margin: number): Span[] {
  const spans = blocked.map(([a, b]) => [a - margin, b + margin] as Span).sort((a, b) => a[0] - b[0]);
  const free: Span[] = [];
  let cursor = from;
  for (const [a, b] of spans) {
    if (b <= cursor) continue;
    if (a > cursor) free.push([cursor, Math.min(a, to)]);
    cursor = Math.max(cursor, b);
    if (cursor >= to) break;
  }
  if (cursor < to) free.push([cursor, to]);
  return free.filter(([a, b]) => b - a > 0);
}

/**
 * Spread `count` items of width `width` evenly over the free intervals,
 * keeping at least `gap` px between neighbours. Returns left x positions.
 */
export function placeAlong(free: Span[], count: number, width: number, gap: number, rnd: () => number): number[] {
  if (count <= 0) return [];
  const usable = free.map(([a, b]) => [a, b - width] as Span).filter(([a, b]) => b >= a);
  const total = usable.reduce((sum, [a, b]) => sum + (b - a), 0);
  if (total <= 0) return [];
  const step = total / count;
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    let t = Math.min(total, Math.max(0, step * (i + 0.5) + (rnd() - 0.5) * step * 0.4));
    let x = usable[0][0];
    for (const [a, b] of usable) {
      if (t <= b - a) { x = a + t; break; }
      t -= b - a;
      x = b;
    }
    const prev = result[result.length - 1];
    if (prev !== undefined && x - (prev + width) < gap) {
      // Push right to keep the gap, staying inside a usable interval.
      const wanted = prev + width + gap;
      const fit = usable.find(([a, b]) => b >= wanted && a <= b);
      if (!fit) continue;
      x = Math.max(wanted, fit[0]);
    }
    result.push(Math.round(x));
  }
  return result;
}

export function buildLayout(level: LevelOutline): LevelLayout {
  const play = level.play;
  const seed = play.layoutSeed ?? level.id;
  const rnd = mulberry32(seed * 7919 + 17);
  const length = play.length;
  const portalX = length - 230;
  const reserved: Span[] = [[0, 720], [portalX - 480, length]];

  const arenaX = play.boss ? length - 1150 : null;
  if (arenaX !== null) reserved.push([arenaX - 260, length]);

  let triggerX: number;
  if (play.trigger.at === 'start') triggerX = 330;
  else if (play.trigger.at === 'boss') triggerX = (arenaX ?? length - 1150) + 640;
  else triggerX = Math.round(play.trigger.at * length);
  if (play.trigger.at !== 'boss') reserved.push([triggerX - 300, triggerX + 320]);

  const hazards: Hazard[] = play.hazards.map((h, i) => {
    const x = Math.round(h.at * length);
    reserved.push([x - 620, x + 300]);
    return { id: `h${i}`, type: h.type, x };
  });

  let paintDoorX: number | null = null;
  if (play.paintDoor !== undefined) {
    paintDoorX = Math.round(play.paintDoor * length);
    reserved.push([paintDoorX - 280, paintDoorX + 300]);
  }

  const isFree = (span: Span, extra: Span[] = []): boolean =>
    ![...reserved, ...extra].some(r => overlaps(span, r));

  // Checkpoints near 1/3 and 4/5 of the way, nudged into free ground.
  const checkpoints: number[] = [];
  for (const frac of [0.33, 0.8]) {
    for (let x = Math.round(frac * length); x < portalX - 500; x += 40) {
      if (isFree([x - 70, x + 70])) { checkpoints.push(x); reserved.push([x - 70, x + 70]); break; }
    }
  }

  // Obstacles spread evenly across the free ground.
  const maxH = Math.min(46 + seed * 2.7, 104);
  const obstacles: Obstacle[] = [];
  const obstacleSpots = placeAlong(freeIntervals(720, portalX - 480, reserved, 40), play.obstacles, 84, 300, rnd);
  obstacleSpots.forEach((x, i) => {
    const w = Math.round(56 + rnd() * 28);
    const h = Math.round(40 + rnd() * (maxH - 40));
    obstacles.push({ id: `o${i}`, x, w, h });
  });

  const flowers: Collectible[] = [];
  let fid = 0;
  const addFlower = (x: number, y: number): void => { flowers.push({ id: `f${fid++}`, x: Math.round(x), y: Math.round(y) }); };

  // Flower arcs over obstacles reward jumping.
  for (const o of obstacles) {
    const top = GROUND_Y - o.h;
    addFlower(o.x - 46, top - 40);
    addFlower(o.x + o.w / 2, top - 82);
    addFlower(o.x + o.w + 46, top - 40);
  }

  const solid: Span[] = obstacles.map(o => [o.x - 90, o.x + o.w + 90]);

  // Floating one-way platforms with flowers on top.
  const platforms: Platform[] = [];
  const platformSpots = placeAlong(freeIntervals(760, portalX - 480, [...reserved, ...solid], 30), play.platforms, 220, 120, rnd);
  for (const x of platformSpots) {
    const w = Math.round(160 + rnd() * 60);
    const y = Math.round(GROUND_Y - 118 - rnd() * 36);
    platforms.push({ x, y, w });
    for (let k = 0; k < 3; k++) addFlower(x + w * (0.25 + k * 0.25), y - 34);
  }

  // Short rows of ground flowers in open stretches.
  for (let x = 900; x < portalX - 500; x += 520 + Math.round(rnd() * 160)) {
    const row: Span = [x - 20, x + 130];
    if (isFree(row, solid)) for (let k = 0; k < 3; k++) addFlower(x + k * 52, GROUND_Y - 34);
  }

  // Bead clusters (tap to pick up so nobody trips).
  const beads: Collectible[] = [];
  const beadSpots = placeAlong(freeIntervals(900, portalX - 480, [...reserved, ...solid], 50), play.beads, 74, 220, rnd);
  beadSpots.forEach((x, i) => {
    beads.push({ id: `b${i * 2}`, x, y: GROUND_Y - 14 });
    beads.push({ id: `b${i * 2 + 1}`, x: x + 44, y: GROUND_Y - 14 });
  });

  // Bow-practice targets appear after the bow is found.
  const targets: Collectible[] = [];
  for (let i = 0; i < play.targets; i++) {
    const start = play.trigger.at === 'start' || play.trigger.at === 'boss' ? 900 : triggerX + 520;
    targets.push({ id: `t${i}`, x: Math.round(start + i * 760), y: GROUND_Y - 250 });
  }

  return {
    length, obstacles, platforms, flowers, beads, hazards, checkpoints,
    trigger: { kind: play.trigger.kind, x: triggerX },
    paintDoorX, targets, portalX, arenaX
  };
}
