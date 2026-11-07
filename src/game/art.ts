/**
 * All game art is drawn here with Canvas 2D: original shapes, no external
 * images, fonts or licensed media. Characters follow Zoey's canon: Lyla is a
 * fluffy WHITE bunny with a PINK fanny pack who never looks robotic; Ridensee
 * is a BLUE boy bunny with a GREEN fanny pack.
 *
 * Textures are drawn at RES× (2× on retina iPads) but registered at their
 * logical size, so sprites keep their game size while showing twice the
 * detail. Shading uses gradients, soft shadows and rim highlights.
 */
import Phaser from 'phaser';
import { RES } from './hidpi';

type Ctx = CanvasRenderingContext2D;
type Stops = Array<[number, string]>;

/**
 * Create a canvas texture drawn at RES× and registered at w×h logical pixels
 * (unless `raw`).
 * The GL texture keeps the full-resolution canvas; the frame and source report
 * the logical size, so UVs still span 0..1 and sprites render at game size.
 */
export function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void, raw = false): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, Math.ceil(w * RES), Math.ceil(h * RES));
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.save();
  ctx.scale(RES, RES);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  ctx.restore();
  tex.refresh();
  // `raw` textures keep their full RES× size (TileSprites copy frames by pixel size; use tileScale 1/RES).
  if (RES !== 1 && !raw) {
    const source = tex.source[0];
    source.width = w;
    source.height = h;
    tex.get().setSize(w, h);
  }
}

// ------------------------------------------------------------------ helpers

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(rx, 0.5), Math.max(ry, 0.5), rot, 0, Math.PI * 2);
}

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(r, 0.5), 0, Math.PI * 2);
}

export function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function lin(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: Stops): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

export function rad(ctx: Ctx, x: number, y: number, r: number, stops: Stops, fx = x, fy = y, r0 = 0): CanvasGradient {
  const g = ctx.createRadialGradient(fx, fy, r0, x, y, Math.max(r, 0.5));
  for (const [o, c] of stops) g.addColorStop(o, c);
  return g;
}

function fillStroke(ctx: Ctx, fill: string | CanvasGradient, stroke?: string, width = 2.5): void {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

/** Canvas shadows ignore the transform, so scale them for hi-res textures. */
export function softShadow(ctx: Ctx, blur: number, offsetY: number, color: string): void {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur * RES;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = offsetY * RES;
}

export function noShadow(ctx: Ctx): void {
  ctx.shadowColor = 'rgba(0,0,0,0)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function star(ctx: Ctx, x: number, y: number, outer: number, inner: number, points = 5, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rot + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** A white highlight arc, used as rim light on round shapes. */
function rim(ctx: Ctx, x: number, y: number, r: number, from: number, to: number, alpha = 0.85, width = 2): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, r, from, to);
  ctx.stroke();
  ctx.restore();
}

/** Glossy spot highlight. */
function gloss(ctx: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.75, rot = -0.5): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ellipse(ctx, x, y, rx, ry, rot);
  ctx.fillStyle = rad(ctx, x, y, Math.max(rx, ry), [[0, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------- bunnies

export interface BunnyLook {
  hi: string;
  fur: string;
  shade: string;
  outline: string;
  inner: string;
  innerDark: string;
  pack: string;
  packLight: string;
  packDark: string;
  iris: string;
  lashes: boolean;
}

export const LYLA: BunnyLook = {
  hi: '#ffffff', fur: '#fbf8ff', shade: '#ddd3ee', outline: '#8a78a8', inner: '#ffc2dc', innerDark: '#f48fbc',
  pack: '#ff5fae', packLight: '#ff9fd0', packDark: '#c83c86', iris: '#4a2a66', lashes: true
};
export const RIDENSEE: BunnyLook = {
  hi: '#a9d7ff', fur: '#5aa9ff', shade: '#3172c9', outline: '#22508c', inner: '#d4ebff', innerDark: '#8cc4ff',
  pack: '#3ccf6a', packLight: '#7fe79b', packDark: '#1f9147', iris: '#16233d', lashes: false
};
export const POLICE: BunnyLook = {
  hi: '#f2e4d0', fur: '#d9c3a5', shade: '#b09272', outline: '#735b44', inner: '#ffd0d0', innerDark: '#eaa0a0',
  pack: '#2f4f9e', packLight: '#5a7fd0', packDark: '#1d3470', iris: '#2b1d12', lashes: false
};

type BunnyPose = 'run0' | 'run1' | 'run2' | 'run3' | 'jump' | 'stand' | 'cheer';

/** Side-view bunny facing right in a 120×122 box, feet on y≈116. */
function drawBunny(ctx: Ctx, look: BunnyLook, pose: BunnyPose): void {
  const o = look.outline;
  const bob = pose === 'run1' || pose === 'run3' ? -3 : 0;
  const lift = pose === 'jump' ? -6 : pose === 'cheer' ? -4 : 0;
  const furBody = (cx: number, cy: number, r: number): CanvasGradient =>
    rad(ctx, cx, cy, r, [[0, look.hi], [0.5, look.fur], [1, look.shade]], cx - r * 0.35, cy - r * 0.45);
  ctx.save();
  ctx.translate(0, bob + lift);

  // Back leg + foot.
  const backFoot: Record<BunnyPose, [number, number, number]> = {
    run0: [30, 109, -0.25], run1: [40, 111, 0], run2: [52, 110, 0.15], run3: [36, 105, -0.4],
    jump: [26, 104, -0.6], stand: [40, 111, 0], cheer: [40, 111, 0]
  };
  const [bx, by, br] = backFoot[pose];
  ellipse(ctx, bx, by, 17, 7, br);
  fillStroke(ctx, lin(ctx, bx, by - 7, bx, by + 7, [[0, look.fur], [1, look.shade]]), o);

  // Tail puff.
  circle(ctx, 22, 80, 10);
  fillStroke(ctx, furBody(22, 80, 11), o);
  ctx.fillStyle = look.hi;
  for (const [tx, ty, tr] of [[16, 76, 4], [19, 86, 3.5], [27, 73, 3.5]]) { circle(ctx, tx, ty, tr); ctx.fill(); }

  // Back ear (behind head).
  const earSwing = pose === 'jump' ? -0.35 : pose === 'cheer' ? 0.1 : (pose === 'run1' || pose === 'run3') ? -0.12 : -0.2;
  ellipse(ctx, 56, 30, 9, 27, earSwing - 0.15);
  fillStroke(ctx, lin(ctx, 50, 4, 62, 56, [[0, look.fur], [1, look.shade]]), o);
  ellipse(ctx, 56.5, 32, 4, 18, earSwing - 0.15);
  ctx.fillStyle = look.innerDark; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;

  // Body.
  ellipse(ctx, 52, 84, 31, 25);
  fillStroke(ctx, furBody(46, 76, 36), o);
  // Fluffy tufts along the back.
  for (const [fx, fy, fr] of [[30, 66, 6], [40, 61, 6], [52, 59, 6], [24, 76, 5]]) {
    circle(ctx, fx, fy, fr); ctx.fillStyle = look.hi; ctx.fill();
  }
  ctx.strokeStyle = o; ctx.lineWidth = 2;
  for (const [fx, fy, a0, a1] of [[30, 66, 1.05, 1.6], [40, 61, 1.1, 1.7], [52, 59, 1.2, 1.8]]) {
    ctx.beginPath(); ctx.arc(fx, fy, 6, Math.PI * a0, Math.PI * a1); ctx.stroke();
  }
  // Belly: soft shade underneath, light chest fluff.
  ellipse(ctx, 56, 97, 20, 8);
  ctx.fillStyle = look.shade; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1;
  ctx.strokeStyle = look.hi; ctx.lineWidth = 1.6;
  for (const [cx, cy] of [[74, 80], [78, 86], [72, 90]]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 4, cy + 2); ctx.stroke(); }

  // Fanny pack: strap and glossy pouch with stitching.
  ctx.strokeStyle = look.packDark; ctx.lineWidth = 5.5;
  ctx.beginPath(); ctx.moveTo(25, 81); ctx.quadraticCurveTo(52, 94, 81, 84); ctx.stroke();
  ctx.strokeStyle = look.pack; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(25, 80); ctx.quadraticCurveTo(52, 93, 81, 83); ctx.stroke();
  softShadow(ctx, 3, 1.5, 'rgba(80,20,60,0.35)');
  roundRect(ctx, 51, 81, 28, 18, 7);
  fillStroke(ctx, lin(ctx, 0, 81, 0, 99, [[0, look.packLight], [0.45, look.pack], [1, look.packDark]]), look.packDark, 2);
  noShadow(ctx);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.setLineDash([2.2, 2]);
  roundRect(ctx, 54, 84, 22, 12, 5); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = look.packDark; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(54, 89); ctx.lineTo(76, 89); ctx.stroke();
  circle(ctx, 73, 89, 2.4); ctx.fillStyle = lin(ctx, 0, 87, 0, 92, [[0, '#fff3b0'], [1, '#e0a91c']]); ctx.fill();
  gloss(ctx, 58, 84, 6, 2.2, 0.8, 0);

  // Front foot.
  const frontFoot: Record<BunnyPose, [number, number]> = {
    run0: [76, 112], run1: [68, 111], run2: [60, 112], run3: [80, 106], jump: [84, 102], stand: [70, 112], cheer: [70, 112]
  };
  const [ffx, ffy] = frontFoot[pose];
  ellipse(ctx, ffx, ffy, 12, 6, 0.1);
  fillStroke(ctx, lin(ctx, ffx, ffy - 6, ffx, ffy + 6, [[0, look.hi], [1, look.shade]]), o);

  // Head.
  circle(ctx, 76, 58, 23);
  fillStroke(ctx, furBody(70, 50, 28), o);
  circle(ctx, 66, 70, 9); ctx.fillStyle = look.fur; ctx.fill(); // cheek fluff
  rim(ctx, 76, 58, 20.5, Math.PI * 1.15, Math.PI * 1.55, 0.9, 1.8);

  // Front ear with gradient inner.
  ellipse(ctx, 70, 24, 10, 28, earSwing + 0.1);
  fillStroke(ctx, lin(ctx, 62, -2, 78, 50, [[0, look.hi], [0.6, look.fur], [1, look.shade]]), o);
  ellipse(ctx, 70.5, 26, 4.8, 19.5, earSwing + 0.1);
  ctx.fillStyle = lin(ctx, 70, 8, 70, 44, [[0, look.inner], [1, look.innerDark]]); ctx.fill();

  // Front paw (raised when cheering).
  if (pose === 'cheer') { ellipse(ctx, 84, 62, 7, 10, -0.5); fillStroke(ctx, furBody(82, 58, 10), o, 2.2); }
  else { ellipse(ctx, 78, 98, 7, 9, 0.3); fillStroke(ctx, furBody(76, 95, 10), o, 2.2); }

  // Eye: glossy iris with two highlights (and lashes for Lyla).
  ellipse(ctx, 85, 54, 5, 5.8);
  ctx.fillStyle = rad(ctx, 85, 55, 6, [[0, look.iris], [0.7, '#1e1030'], [1, '#120a1e']], 84, 57); ctx.fill();
  circle(ctx, 86.6, 51.8, 1.9); ctx.fillStyle = '#ffffff'; ctx.fill();
  circle(ctx, 83.8, 57, 0.9); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
  if (look.lashes) {
    ctx.strokeStyle = '#2a1640'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(88, 49.5); ctx.lineTo(91.5, 47.5); ctx.moveTo(89.2, 51.5); ctx.lineTo(92.6, 50.6); ctx.stroke();
  }
  // Blush, nose, mouth, whiskers.
  circle(ctx, 84, 65.5, 5.5);
  ctx.fillStyle = rad(ctx, 84, 65.5, 5.5, [[0, 'rgba(255,140,190,0.7)'], [1, 'rgba(255,140,190,0)']]); ctx.fill();
  ellipse(ctx, 97.5, 60, 3.6, 3);
  ctx.fillStyle = rad(ctx, 97.5, 60, 3.6, [[0, '#ffb3d4'], [1, '#ef6fa6']], 96.5, 59); ctx.fill();
  circle(ctx, 96.8, 59, 0.9); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.strokeStyle = o; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.moveTo(97, 63); ctx.quadraticCurveTo(95, 67, 91, 67); ctx.stroke();
  ctx.lineWidth = 1; ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.moveTo(95, 62); ctx.lineTo(108, 59); ctx.moveTo(95, 64); ctx.lineTo(108, 66); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPoliceHat(ctx: Ctx): void {
  ctx.save();
  softShadow(ctx, 3, 1.5, 'rgba(10,20,60,0.4)');
  roundRect(ctx, 58, 29, 36, 15, 6);
  fillStroke(ctx, lin(ctx, 0, 29, 0, 44, [[0, '#4a6fc4'], [1, '#203a80']]), '#16295a', 2.2);
  noShadow(ctx);
  ctx.fillStyle = lin(ctx, 56, 0, 100, 0, [[0, '#101c3e'], [1, '#1f3670']]);
  roundRect(ctx, 55, 41.5, 46, 6, 3); ctx.fill();
  gloss(ctx, 66, 33, 7, 2.5, 0.6, 0);
  star(ctx, 76, 36.5, 5.5, 2.6);
  ctx.fillStyle = lin(ctx, 0, 31, 0, 42, [[0, '#fff1a0'], [1, '#e0a91c']]); ctx.fill();
  // Badge on the chest.
  star(ctx, 70, 86, 6.5, 3.1);
  ctx.fillStyle = lin(ctx, 0, 80, 0, 92, [[0, '#fff1a0'], [1, '#d99b12']]); ctx.fill();
  ctx.strokeStyle = '#a8780e'; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- others

function drawTiger(ctx: Ctx, leaping: boolean): void {
  const o = '#7a3d0c';
  const orange = (x: number, y: number, r: number): CanvasGradient =>
    rad(ctx, x, y, r, [[0, '#ffc277'], [0.6, '#ff9a3c'], [1, '#d96a12']], x - r * 0.3, y - r * 0.4);
  ctx.save();
  if (leaping) { ctx.translate(80, 60); ctx.rotate(-0.18); ctx.translate(-80, -60); }
  // Tail.
  ctx.strokeStyle = o; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(30, 62); ctx.quadraticCurveTo(6, 40, 14, 22); ctx.stroke();
  ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 6.5;
  ctx.beginPath(); ctx.moveTo(30, 62); ctx.quadraticCurveTo(6, 40, 14, 22); ctx.stroke();
  ctx.strokeStyle = '#2e1a0c'; ctx.lineWidth = 3;
  for (const t of [0.35, 0.6, 0.85]) {
    const x = 30 * (1 - t) ** 2 + 2 * 6 * t * (1 - t) + 14 * t * t, y = 62 * (1 - t) ** 2 + 2 * 40 * t * (1 - t) + 22 * t * t;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 1); ctx.lineTo(x + 4, y + 1); ctx.stroke();
  }
  // Legs.
  const legs = leaping ? [[40, 92, -0.7], [58, 92, -0.5], [104, 86, 0.8], [118, 84, 0.9]] : [[42, 100, 0], [60, 100, 0], [102, 100, 0], [118, 100, 0]];
  for (const [lx, ly, lr] of legs) { ellipse(ctx, lx, ly, 8.5, 15, lr); fillStroke(ctx, orange(lx, ly - 6, 16), o); }
  // Body.
  softShadow(ctx, 4, 2, 'rgba(90,40,0,0.25)');
  ellipse(ctx, 80, 70, 52, 27); fillStroke(ctx, orange(70, 58, 56), o);
  noShadow(ctx);
  ellipse(ctx, 84, 83, 34, 10); ctx.fillStyle = lin(ctx, 0, 74, 0, 92, [[0, '#fff6e6'], [1, '#f6dcb8']]); ctx.fill();
  ctx.fillStyle = '#3a2210';
  for (const sx of [48, 64, 80, 96]) {
    ctx.beginPath(); ctx.moveTo(sx - 3, 45); ctx.quadraticCurveTo(sx + 8, 55, sx + 1, 66); ctx.quadraticCurveTo(sx + 3, 55, sx + 3, 45); ctx.closePath(); ctx.fill();
  }
  rim(ctx, 80, 70, 49, Math.PI * 1.15, Math.PI * 1.6, 0.6, 2);
  // Head.
  circle(ctx, 134, 54, 25); fillStroke(ctx, orange(128, 46, 28), o);
  for (const ex of [118, 146]) {
    circle(ctx, ex, 33, 8.5); fillStroke(ctx, orange(ex, 31, 9), o);
    circle(ctx, ex, 33.5, 4); ctx.fillStyle = '#ffd9b8'; ctx.fill();
  }
  ellipse(ctx, 142, 64, 14, 9.5); ctx.fillStyle = lin(ctx, 0, 55, 0, 73, [[0, '#fff6e6'], [1, '#f2d6b0']]); ctx.fill();
  ctx.fillStyle = '#3a2210';
  for (const [x1, y1, x2, y2] of [[122, 46, 129, 52], [124, 62, 131, 60], [134, 31, 136, 39], [140, 30, 140, 38]]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = 3; ctx.strokeStyle = '#3a2210'; ctx.stroke();
  }
  ellipse(ctx, 140, 47, 5, 5.5); ctx.fillStyle = rad(ctx, 140, 47, 5.5, [[0, '#6a4a10'], [0.55, '#2b1a0c'], [1, '#120a04']]); ctx.fill();
  circle(ctx, 141.6, 45.2, 1.7); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(133, 39); ctx.lineTo(146, 42); ctx.stroke(); // sneaky brow
  ellipse(ctx, 154, 60, 4.5, 3.5); ctx.fillStyle = rad(ctx, 154, 60, 4.5, [[0, '#ff8aa0'], [1, '#c8556b']], 153, 59); ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(152, 66); ctx.quadraticCurveTo(146, 71, 140, 67); ctx.stroke();
  rim(ctx, 134, 54, 22.5, Math.PI * 1.2, Math.PI * 1.65, 0.7, 1.8);
  ctx.restore();
}

function drawMonkey(ctx: Ctx, grabbing: boolean): void {
  const o = '#4e2e12';
  const brown = (x: number, y: number, r: number): CanvasGradient =>
    rad(ctx, x, y, r, [[0, '#c98d55'], [0.6, '#a8703c'], [1, '#7c4e22']], x - r * 0.3, y - r * 0.4);
  ctx.strokeStyle = o; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(30, 66); ctx.quadraticCurveTo(8, 70, 12, 96); ctx.stroke();
  ctx.strokeStyle = '#a8703c'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(30, 66); ctx.quadraticCurveTo(8, 70, 12, 96); ctx.stroke();
  const armY = grabbing ? 70 : 20;
  for (const ax of [34, 66]) {
    const ex = ax + (ax < 50 ? -10 : 10);
    ctx.strokeStyle = o; ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(ax, 58); ctx.lineTo(ex, armY); ctx.stroke();
    ctx.strokeStyle = '#b07a44'; ctx.lineWidth = 7.5; ctx.beginPath(); ctx.moveTo(ax, 58); ctx.lineTo(ex, armY); ctx.stroke();
    circle(ctx, ex, armY, 5.5); fillStroke(ctx, '#f1cfa3', o, 2);
  }
  ellipse(ctx, 50, 72, 22, 24); fillStroke(ctx, brown(46, 64, 26), o);
  ellipse(ctx, 50, 78, 13, 15); ctx.fillStyle = lin(ctx, 0, 63, 0, 93, [[0, '#f8dcb4'], [1, '#e8bf8c']]); ctx.fill();
  circle(ctx, 50, 40, 20); fillStroke(ctx, brown(45, 33, 23), o);
  for (const ex of [29, 71]) { circle(ctx, ex, 40, 8); fillStroke(ctx, '#f1cfa3', o, 2); circle(ctx, ex, 40, 4); ctx.fillStyle = '#e3a87a'; ctx.fill(); }
  ellipse(ctx, 50, 46, 14.5, 11.5); ctx.fillStyle = lin(ctx, 0, 35, 0, 57, [[0, '#f8dcb4'], [1, '#e8bf8c']]); ctx.fill();
  for (const ex of [43, 57]) {
    ellipse(ctx, ex, 36, 3.6, 4.2); ctx.fillStyle = '#20120a'; ctx.fill();
    circle(ctx, ex + 1.2, 34.6, 1.2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.strokeStyle = '#20120a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(50, 47, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  rim(ctx, 50, 40, 17.5, Math.PI * 1.15, Math.PI * 1.6, 0.6, 1.6);
  for (const fx of [40, 60]) { ellipse(ctx, fx, 96, 8, 5); fillStroke(ctx, brown(fx, 94, 8), o, 2); }
}

function drawHand(ctx: Ctx): void {
  // A big cartoon glove pressing down: fingers point toward the floor.
  const o = '#6e4886';
  const glove = lin(ctx, 20, 0, 130, 0, [[0, '#ffffff'], [0.55, '#f6efff'], [1, '#dccbef']]);
  softShadow(ctx, 6, 3, 'rgba(60,20,90,0.3)');
  roundRect(ctx, 30, 0, 80, 70, 12); fillStroke(ctx, lin(ctx, 0, 0, 0, 70, [[0, '#e9c9fa'], [1, '#d6a8f0']]), o);
  noShadow(ctx);
  ctx.fillStyle = lin(ctx, 0, 4, 0, 20, [[0, '#f8e6ff'], [1, '#e2b8f5']]); roundRect(ctx, 34, 4, 72, 15, 6); ctx.fill();
  for (let i = 0; i < 4; i++) {
    roundRect(ctx, 28 + i * 22, 56, 20, 66, 10); fillStroke(ctx, glove, o);
    gloss(ctx, 34 + i * 22, 70, 3, 9, 0.7, 0);
  }
  ellipse(ctx, 120, 70, 12, 26, -0.4); fillStroke(ctx, glove, o);
  ctx.strokeStyle = o; ctx.lineWidth = 1.8; ctx.globalAlpha = 0.7;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(32 + i * 22, 100); ctx.lineTo(44 + i * 22, 100); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

function drawKing(ctx: Ctx): void {
  const o = '#3e2160';
  // Velvet cape.
  softShadow(ctx, 6, 3, 'rgba(40,10,70,0.3)');
  ctx.beginPath(); ctx.moveTo(30, 70); ctx.quadraticCurveTo(20, 150, 40, 170); ctx.lineTo(120, 170); ctx.quadraticCurveTo(140, 150, 130, 70); ctx.closePath();
  fillStroke(ctx, lin(ctx, 20, 0, 140, 0, [[0, '#5a2a9a'], [0.45, '#8e52d8'], [1, '#4a2080']]), o);
  noShadow(ctx);
  ctx.fillStyle = lin(ctx, 0, 158, 0, 172, [[0, '#ffffff'], [1, '#e6e0f0']]); roundRect(ctx, 33, 159, 94, 12, 4); ctx.fill();
  for (let x = 40; x < 124; x += 12) { ellipse(ctx, x, 165, 1.8, 3); ctx.fillStyle = '#2a1a3a'; ctx.fill(); }
  // Golden tunic.
  ellipse(ctx, 80, 118, 38, 44);
  fillStroke(ctx, rad(ctx, 70, 100, 50, [[0, '#fff2a8'], [0.55, '#ffd84d'], [1, '#c99418']], 66, 92), '#a87b10');
  for (const by of [96, 114, 132]) { circle(ctx, 80, by, 3.2); ctx.fillStyle = lin(ctx, 0, by - 3, 0, by + 3, [[0, '#fff'], [1, '#b8932a']]); ctx.fill(); }
  // Head.
  circle(ctx, 80, 58, 30);
  fillStroke(ctx, rad(ctx, 72, 48, 34, [[0, '#fff2e2'], [0.7, '#ffe0c2'], [1, '#e9bd97']], 70, 44), o);
  // Crown with jewels.
  ctx.beginPath(); ctx.moveTo(56, 36); ctx.lineTo(58, 12); ctx.lineTo(68, 26); ctx.lineTo(80, 6); ctx.lineTo(92, 26); ctx.lineTo(102, 12); ctx.lineTo(104, 36); ctx.closePath();
  fillStroke(ctx, lin(ctx, 0, 6, 0, 36, [[0, '#fff3a6'], [0.5, '#ffd84d'], [1, '#c99418']]), '#a87b10');
  for (const [cx, cy, col] of [[80, 22, '#ff4f8b'], [64, 30, '#4fb3ff'], [96, 30, '#4fd17a']] as const) {
    circle(ctx, cx, cy, 3.8); ctx.fillStyle = col; ctx.fill(); circle(ctx, cx - 1.2, cy - 1.2, 1.2); ctx.fillStyle = '#fff'; ctx.fill();
  }
  // Face: smiling... a little too sly.
  for (const ex of [70, 90]) {
    ellipse(ctx, ex, 56, 3.8, 4.2); ctx.fillStyle = '#2a1a3a'; ctx.fill();
    circle(ctx, ex + 1, 54.6, 1.1); ctx.fillStyle = '#fff'; ctx.fill();
  }
  ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(64, 47); ctx.lineTo(75, 50); ctx.moveTo(96, 47); ctx.lineTo(85, 50); ctx.stroke();
  ctx.fillStyle = lin(ctx, 0, 66, 0, 74, [[0, '#9a6a44'], [1, '#6a4020']]);
  ellipse(ctx, 72, 70, 10, 4, 0.2); ctx.fill(); ellipse(ctx, 88, 70, 10, 4, -0.2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, 74, 7, 0.25, Math.PI - 0.25); ctx.stroke();
  circle(ctx, 68, 64, 4.5); ctx.fillStyle = 'rgba(255,140,150,0.35)'; ctx.fill();
  circle(ctx, 92, 64, 4.5); ctx.fill();
  // Phone in hand, screen glowing.
  softShadow(ctx, 8, 0, 'rgba(120,230,255,0.8)');
  roundRect(ctx, 112, 92, 22, 36, 5); fillStroke(ctx, '#2a2a3a', '#111', 2);
  noShadow(ctx);
  roundRect(ctx, 115, 96, 16, 26, 3); ctx.fillStyle = lin(ctx, 0, 96, 0, 122, [[0, '#c8f6ff'], [1, '#5fcfff']]); ctx.fill();
  ellipse(ctx, 116, 116, 9, 8); fillStroke(ctx, '#ffe3c7', o, 2);
}

function drawMonster(ctx: Ctx, friendly: boolean): void {
  const w = friendly ? 120 : 320;
  const s = w / 320;
  ctx.save();
  ctx.scale(s, s);
  const o = '#2e1450';
  const fur = rad(ctx, 140, 150, 150, [[0, '#c4a2ff'], [0.5, '#8a5cf0'], [1, '#5a32b8']], 120, 120);
  // Fuzzy outline.
  softShadow(ctx, 10, 6, 'rgba(40,10,80,0.35)');
  ctx.fillStyle = fur;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) { circle(ctx, 160 + Math.cos(a) * 128, 190 + Math.sin(a) * 118, 22); ctx.fill(); }
  noShadow(ctx);
  ellipse(ctx, 160, 190, 132, 122); fillStroke(ctx, fur, o, 4);
  // Fur strokes.
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2, r = 70 + (i % 4) * 12;
    const x = 160 + Math.cos(a) * r, y = 190 + Math.sin(a) * r * 0.9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); ctx.stroke();
  }
  ellipse(ctx, 160, 222, 80, 66); ctx.fillStyle = rad(ctx, 160, 210, 80, [[0, '#e2d2ff'], [1, '#a98af0']]); ctx.fill();
  // Horns.
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(160 + dir * 70, 90); ctx.quadraticCurveTo(160 + dir * 120, 40, 160 + dir * 100, 10); ctx.quadraticCurveTo(160 + dir * 90, 60, 160 + dir * 40, 80); ctx.closePath();
    fillStroke(ctx, lin(ctx, 160 + dir * 40, 90, 160 + dir * 100, 10, [[0, '#d9b45a'], [0.5, '#ffe6a8'], [1, '#fff8e0']]), '#a8801a', 3);
  }
  // Feet.
  for (const fx of [100, 220]) { ellipse(ctx, fx, 306, 42, 16); fillStroke(ctx, lin(ctx, 0, 290, 0, 322, [[0, '#8a64e8'], [1, '#4a2aa0']]), o, 4); }
  // Eyes.
  for (const ex of [118, 202]) {
    circle(ctx, ex, 150, 30); fillStroke(ctx, rad(ctx, ex, 150, 30, [[0, '#ffffff'], [0.85, '#f2ecff'], [1, '#d8ccf2']], ex - 8, 140), o, 3);
    circle(ctx, ex + 6, 156, 13.5); ctx.fillStyle = rad(ctx, ex + 6, 156, 13.5, [[0, '#6a4aa0'], [0.6, '#2a1a3a'], [1, '#140a20']]); ctx.fill();
    circle(ctx, ex + 10, 150, 4.8); ctx.fillStyle = '#ffffff'; ctx.fill();
    circle(ctx, ex + 2, 161, 2); ctx.fill();
  }
  ctx.strokeStyle = o; ctx.lineWidth = 8;
  if (friendly) {
    ctx.beginPath(); ctx.arc(160, 200, 34, 0.25, Math.PI - 0.25); ctx.stroke();
    for (const cx of [100, 220]) { circle(ctx, cx, 196, 16); ctx.fillStyle = rad(ctx, cx, 196, 16, [[0, 'rgba(255,150,205,0.85)'], [1, 'rgba(255,150,205,0)']]); ctx.fill(); }
  } else {
    ctx.beginPath(); ctx.moveTo(84, 108); ctx.lineTo(140, 124); ctx.moveTo(236, 108); ctx.lineTo(180, 124); ctx.stroke();
    ctx.beginPath(); ctx.arc(160, 236, 34, Math.PI + 0.35, -0.35); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(140, 214); ctx.lineTo(148, 228); ctx.lineTo(156, 213); ctx.fill();
    ctx.beginPath(); ctx.moveTo(164, 213); ctx.lineTo(172, 228); ctx.lineTo(180, 214); ctx.fill();
  }
  rim(ctx, 160, 190, 124, Math.PI * 1.15, Math.PI * 1.55, 0.45, 5);
  ctx.restore();
}

// ---------------------------------------------------------------- objects

function drawFlower(ctx: Ctx, petal: string, petalLight: string, size: number, glow = true): void {
  const c = size / 2;
  const r = size * 0.2;
  const cy = c * 0.82;
  if (glow) {
    circle(ctx, c, cy, size * 0.48);
    ctx.fillStyle = rad(ctx, c, cy, size * 0.48, [[0, 'rgba(255,250,210,0.55)'], [1, 'rgba(255,250,210,0)']]); ctx.fill();
  }
  ctx.strokeStyle = lin(ctx, 0, c + r, 0, size, [[0, '#4fb565'], [1, '#2e7d42']]); ctx.lineWidth = size * 0.075;
  ctx.beginPath(); ctx.moveTo(c, c + r); ctx.quadraticCurveTo(c - size * 0.04, size * 0.8, c, size - 2); ctx.stroke();
  ellipse(ctx, c + size * 0.13, size * 0.8, size * 0.13, size * 0.065, -0.5);
  ctx.fillStyle = lin(ctx, c, size * 0.74, c + size * 0.25, size * 0.86, [[0, '#7fd98f'], [1, '#3a9a52']]); ctx.fill();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = c + Math.cos(a) * r * 1.25, py = cy + Math.sin(a) * r * 1.25;
    ellipse(ctx, px, py, r * 0.98, r * 0.72, a);
    ctx.fillStyle = rad(ctx, px, py, r, [[0, petalLight], [1, petal]], c + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6);
    ctx.fill();
    ctx.strokeStyle = 'rgba(110,40,120,0.35)'; ctx.lineWidth = 1.1; ctx.stroke();
  }
  // Money center: a shiny gold coin.
  circle(ctx, c, cy, r * 0.95);
  fillStroke(ctx, rad(ctx, c, cy, r, [[0, '#fff6b8'], [0.6, '#ffd84d'], [1, '#d99b12']], c - r * 0.35, cy - r * 0.35), '#b8800e', 1.4);
  ctx.strokeStyle = 'rgba(160,100,0,0.55)'; ctx.lineWidth = 1;
  circle(ctx, c, cy, r * 0.62); ctx.stroke();
  circle(ctx, c - r * 0.32, cy - r * 0.32, r * 0.22); ctx.fillStyle = '#ffffff'; ctx.fill();
}

function drawPortal(ctx: Ctx, size: number): void {
  const c = size / 2;
  circle(ctx, c, c, c);
  ctx.fillStyle = rad(ctx, c, c, c, [[0, '#ffffff'], [0.12, '#c8f0ff'], [0.35, '#6fb6ff'], [0.62, '#7a4dff'], [0.85, '#4a1fb8'], [1, 'rgba(60,20,160,0)']]);
  ctx.fill();
  // Spiral arms.
  for (let arm = 0; arm < 4; arm++) {
    ctx.beginPath();
    for (let t = 0; t <= 1.001; t += 0.04) {
      const a = arm * (Math.PI / 2) + t * Math.PI * 1.6;
      const r = c * (0.12 + t * 0.78);
      const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = arm % 2 ? 'rgba(255,255,255,0.7)' : 'rgba(150,230,255,0.75)';
    ctx.lineWidth = 4 - arm * 0.4;
    ctx.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const a = i * 2.39, r = c * (0.25 + (i % 5) * 0.13);
    star(ctx, c + Math.cos(a) * r, c + Math.sin(a) * r, 3.4, 1.3, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
  }
}

function drawCage(ctx: Ctx, open: boolean): void {
  const o = '#8a5a00';
  const gold = (x0: number, x1: number): CanvasGradient => lin(ctx, x0, 0, x1, 0, [[0, '#c98e12'], [0.4, '#fff1a0'], [0.6, '#ffd84d'], [1, '#b8800e']]);
  softShadow(ctx, 5, 3, 'rgba(90,40,0,0.3)');
  ellipse(ctx, 80, 18, 70, 14); fillStroke(ctx, lin(ctx, 0, 4, 0, 32, [[0, '#fff1a0'], [1, '#d9a21c']]), o);
  roundRect(ctx, 6, 168, 148, 16, 6); fillStroke(ctx, lin(ctx, 0, 168, 0, 184, [[0, '#ffe680'], [1, '#c98e12']]), o);
  noShadow(ctx);
  const bars = open ? [14, 30, 46, 122, 138, 152] : [14, 30, 46, 62, 78, 94, 110, 126, 142];
  for (const x of bars) {
    ctx.fillStyle = gold(x - 3.5, x + 3.5);
    roundRect(ctx, x - 3.5, 22, 7, 148, 3.5); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(80, 15, 60, 8, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
  if (!open) {
    softShadow(ctx, 4, 2, 'rgba(90,20,60,0.35)');
    roundRect(ctx, 66, 92, 28, 26, 6); fillStroke(ctx, lin(ctx, 0, 92, 0, 118, [[0, '#ff9fd0'], [1, '#d23f8c']]), '#9c2e6a', 2.2);
    noShadow(ctx);
    ctx.strokeStyle = lin(ctx, 72, 0, 88, 0, [[0, '#c98e12'], [0.5, '#fff1a0'], [1, '#b8800e']]); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(80, 92, 8, Math.PI, 0); ctx.stroke();
    ellipse(ctx, 80, 104, 3, 4); ctx.fillStyle = '#5a1a3a'; ctx.fill();
    gloss(ctx, 72, 97, 4, 2, 0.8, 0);
  }
}

type GateStyle = 'castle' | 'wood' | 'vault' | 'rainbow' | 'cloud';

function drawGate(ctx: Ctx, main: string, dark: string, style: GateStyle): void {
  const w = 120, h = 260;
  softShadow(ctx, 8, 4, 'rgba(40,20,60,0.3)');
  if (style === 'cloud') {
    for (let y = 30; y < h; y += 34) {
      for (const x of [30, 60, 90]) {
        const cx = x + (y % 68 ? 6 : -6);
        circle(ctx, cx, y, 30);
        ctx.fillStyle = rad(ctx, cx, y, 30, [[0, '#ffffff'], [0.75, '#f2f7ff'], [1, '#c9dcf6']], cx - 8, y - 10); ctx.fill();
      }
    }
    noShadow(ctx);
  } else if (style === 'rainbow') {
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    roundRect(ctx, 6, 6, w - 12, h - 12, 44); fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, '#ffffff'], [1, '#efe6ff']]), '#6a3d92', 4);
    noShadow(ctx);
    cols.forEach((c, i) => {
      roundRect(ctx, 16, 20 + i * 38, w - 32, 30, 13); ctx.fillStyle = lin(ctx, 0, 20 + i * 38, 0, 50 + i * 38, [[0, '#ffffff'], [0.25, c], [1, c]]); ctx.fill();
    });
  } else if (style === 'vault') {
    roundRect(ctx, 4, 4, w - 8, h - 8, 18); fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, '#7c8299'], [0.45, '#d9dde8'], [1, '#6a6f86']]), dark, 5);
    noShadow(ctx);
    circle(ctx, w / 2, h / 2, 40); fillStroke(ctx, rad(ctx, w / 2, h / 2, 40, [[0, '#ffffff'], [0.6, '#cfd4e2'], [1, '#8a90a8']], w / 2 - 12, h / 2 - 12), dark, 5);
    ctx.strokeStyle = dark; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + Math.cos(a) * 34, h / 2 + Math.sin(a) * 34); ctx.stroke(); }
    for (const y of [26, h - 26]) for (const x of [22, w - 22]) { circle(ctx, x, y, 6); ctx.fillStyle = rad(ctx, x, y, 6, [[0, '#ffffff'], [1, dark]], x - 2, y - 2); ctx.fill(); }
  } else if (style === 'castle') {
    roundRect(ctx, 4, 4, w - 8, h - 8, 50); fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, dark], [0.35, main], [0.6, '#ffd0ea'], [1, dark]]), dark, 5);
    noShadow(ctx);
    ctx.strokeStyle = lin(ctx, 0, 0, 0, h, [[0, '#7a2058'], [1, '#4a0f34']]); ctx.lineWidth = 7;
    for (const x of [30, 60, 90]) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, h - 8); ctx.stroke(); }
    for (const y of [80, 150, 220]) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
    for (const x of [28, 58, 88]) { ctx.beginPath(); ctx.moveTo(x, 34); ctx.lineTo(x, h - 12); ctx.stroke(); }
  } else {
    roundRect(ctx, 4, 4, w - 8, h - 8, 12); fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, dark], [0.3, main], [0.7, main], [1, dark]]), dark, 5);
    noShadow(ctx);
    // Planks with grain.
    ctx.strokeStyle = dark; ctx.lineWidth = 5;
    for (const y of [50, 110, 170, 230]) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5;
    for (let y = 18; y < h - 10; y += 13) { ctx.beginPath(); ctx.moveTo(12, y); ctx.bezierCurveTo(40, y + 4, 80, y - 4, w - 12, y + 2); ctx.stroke(); }
    for (const y of [50, 110, 170, 230]) for (const x of [16, w - 16]) { circle(ctx, x, y, 3.5); ctx.fillStyle = '#4a4a5a'; ctx.fill(); }
  }
  // Lock with a sparkle "?" — the spelling challenge.
  softShadow(ctx, 5, 2, 'rgba(90,60,0,0.35)');
  roundRect(ctx, w / 2 - 24, h / 2 - 6, 48, 42, 10); fillStroke(ctx, lin(ctx, 0, h / 2 - 6, 0, h / 2 + 36, [[0, '#fff3a6'], [0.5, '#ffd84d'], [1, '#d99b12']]), '#a87b10', 3);
  noShadow(ctx);
  ctx.strokeStyle = lin(ctx, w / 2 - 14, 0, w / 2 + 14, 0, [[0, '#b8800e'], [0.5, '#fff1a0'], [1, '#b8800e']]); ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(w / 2, h / 2 - 6, 14, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#7a4a00'; ctx.font = 'bold 26px "Avenir Next", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', w / 2, h / 2 + 16);
  gloss(ctx, w / 2 - 12, h / 2, 8, 3, 0.7, 0);
}

// --------------------------------------------------- themed obstacles/platforms

export type PropStyle = 'stone' | 'candy' | 'cloud' | 'pot' | 'stump' | 'crate' | 'rock' | 'crystal';
export interface PropColors { main: string; light: string; dark: string; accent: string }

function drawProp(ctx: Ctx, w: number, h: number, style: PropStyle, c: PropColors): void {
  softShadow(ctx, 4, 2, 'rgba(30,10,50,0.28)');
  switch (style) {
    case 'stone': {
      roundRect(ctx, 2, 2, w - 4, h - 4, 7);
      fillStroke(ctx, lin(ctx, 0, 0, 0, h, [[0, c.light], [0.18, c.main], [1, c.dark]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.strokeStyle = c.dark; ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
      for (let y = 18, row = 0; y < h - 4; y += 16, row++) {
        ctx.beginPath(); ctx.moveTo(4, y); ctx.lineTo(w - 4, y); ctx.stroke();
        const off = row % 2 ? w * 0.33 : w * 0.66;
        ctx.beginPath(); ctx.moveTo(off, y); ctx.lineTo(off, Math.min(h - 4, y + 16)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      roundRect(ctx, 5, 4, w - 10, 6, 3); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      break;
    }
    case 'candy': {
      roundRect(ctx, 2, 2, w - 4, h - 4, Math.min(16, w / 3));
      ctx.save(); ctx.clip();
      ctx.fillStyle = c.light; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = c.main;
      for (let x = -h; x < w + h; x += 18) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 9, h); ctx.lineTo(x + 9 + h, 0); ctx.lineTo(x + h, 0); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = lin(ctx, 0, 0, w, 0, [[0, 'rgba(255,255,255,0.35)'], [0.4, 'rgba(255,255,255,0)'], [1, 'rgba(60,0,80,0.18)']]); ctx.fillRect(0, 0, w, h);
      ctx.restore();
      noShadow(ctx);
      roundRect(ctx, 2, 2, w - 4, h - 4, Math.min(16, w / 3)); ctx.strokeStyle = c.dark; ctx.lineWidth = 2.5; ctx.stroke();
      gloss(ctx, w * 0.3, 9, w * 0.22, 3, 0.85, 0);
      break;
    }
    case 'cloud': {
      ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, '#ffffff'], [1, c.dark]]);
      roundRect(ctx, 4, h * 0.35, w - 8, h * 0.65 - 3, 10); ctx.fill();
      for (const [fx, fr] of [[0.25, 0.32], [0.55, 0.42], [0.8, 0.3]]) { circle(ctx, w * fx, h * 0.42, Math.min(w, h * 1.6) * fr); ctx.fill(); }
      noShadow(ctx);
      for (const [fx, fr] of [[0.25, 0.32], [0.55, 0.42]]) gloss(ctx, w * fx - 4, h * 0.3, Math.min(w, h * 1.6) * fr * 0.5, 4, 0.9, 0);
      break;
    }
    case 'pot': {
      ctx.beginPath(); ctx.moveTo(6, 14); ctx.lineTo(w - 6, 14); ctx.lineTo(w - 12, h - 3); ctx.lineTo(12, h - 3); ctx.closePath();
      fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, c.dark], [0.35, c.main], [0.6, c.light], [1, c.dark]]), c.dark, 2.5);
      noShadow(ctx);
      roundRect(ctx, 2, 4, w - 4, 14, 5); fillStroke(ctx, lin(ctx, 0, 4, 0, 18, [[0, c.light], [1, c.main]]), c.dark, 2.5);
      // Little sprout of leaves on top.
      ctx.fillStyle = lin(ctx, 0, 0, 0, 12, [[0, '#8be09a'], [1, '#3a9a52']]);
      for (const dx of [-7, 0, 7]) { ellipse(ctx, w / 2 + dx, 6 - Math.abs(dx) * 0.15, 4, 6, dx * 0.1); ctx.fill(); }
      ctx.fillStyle = c.accent; circle(ctx, w / 2, 3.5, 3); ctx.fill();
      break;
    }
    case 'stump': {
      roundRect(ctx, 4, 8, w - 8, h - 10, 6);
      fillStroke(ctx, lin(ctx, 0, 0, w, 0, [[0, c.dark], [0.3, c.main], [0.65, c.light], [1, c.dark]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.strokeStyle = 'rgba(40,20,0,0.35)'; ctx.lineWidth = 1.5;
      for (let x = 12; x < w - 8; x += 9) { ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + (x % 2 ? 2 : -2), h - 4); ctx.stroke(); }
      ellipse(ctx, w / 2, 10, w / 2 - 4, 7); fillStroke(ctx, rad(ctx, w / 2, 10, w / 2, [[0, '#f6d8a8'], [1, '#c99b62']]), c.dark, 2.5);
      ctx.strokeStyle = 'rgba(120,70,20,0.55)'; ctx.lineWidth = 1.2;
      for (const k of [0.25, 0.5, 0.75]) { ellipse(ctx, w / 2, 10, (w / 2 - 4) * k, 7 * k); ctx.stroke(); }
      ctx.fillStyle = '#5cbf6a'; ellipse(ctx, w * 0.22, h - 6, 7, 4, -0.4); ctx.fill();
      break;
    }
    case 'crate': {
      roundRect(ctx, 2, 2, w - 4, h - 4, 4);
      fillStroke(ctx, lin(ctx, 0, 0, 0, h, [[0, c.light], [1, c.main]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.strokeStyle = c.dark; ctx.lineWidth = 4;
      roundRect(ctx, 6, 6, w - 12, h - 12, 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, 8); ctx.lineTo(w - 8, h - 8); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.4;
      for (let y = 14; y < h - 6; y += 9) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y + 1); ctx.stroke(); }
      for (const [x, y] of [[8, 8], [w - 8, 8], [8, h - 8], [w - 8, h - 8]]) { circle(ctx, x, y, 2.4); ctx.fillStyle = '#6a6a7a'; ctx.fill(); }
      break;
    }
    case 'rock': {
      ctx.beginPath();
      ctx.moveTo(4, h - 2); ctx.quadraticCurveTo(0, h * 0.4, w * 0.3, 6); ctx.quadraticCurveTo(w * 0.6, -2, w * 0.85, 10);
      ctx.quadraticCurveTo(w + 2, h * 0.45, w - 4, h - 2); ctx.closePath();
      fillStroke(ctx, rad(ctx, w * 0.4, h * 0.3, Math.max(w, h), [[0, c.light], [0.5, c.main], [1, c.dark]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.fillStyle = lin(ctx, 0, 0, 0, 14, [[0, '#8fd06a'], [1, '#4f9a3a']]);
      ellipse(ctx, w * 0.45, 9, w * 0.32, 6, -0.1); ctx.fill();
      gloss(ctx, w * 0.3, h * 0.35, 6, 3, 0.5, -0.6);
      break;
    }
    case 'crystal': {
      const pts: Array<[number, number]> = [[w * 0.12, h], [w * 0.05, h * 0.45], [w * 0.3, 2], [w * 0.55, h * 0.25], [w * 0.75, 6], [w * 0.95, h * 0.5], [w * 0.88, h]];
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      softShadow(ctx, 12, 0, c.accent);
      fillStroke(ctx, lin(ctx, 0, 0, w, h, [[0, c.light], [0.5, c.main], [1, c.dark]]), c.dark, 2.2);
      noShadow(ctx);
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(w * 0.3, 6); ctx.lineTo(w * 0.32, h - 4); ctx.moveTo(w * 0.75, 10); ctx.lineTo(w * 0.7, h - 4); ctx.stroke();
      break;
    }
  }
  noShadow(ctx);
}

/** A themed obstacle texture keyed by theme, style and size. */
export function blockTexture(scene: Phaser.Scene, theme: string, w: number, h: number, style: PropStyle, colors: PropColors): string {
  const key = `prop-${theme}-${style}-${w}x${h}`;
  // Texture is exactly the obstacle's size: its physics body comes from the image.
  makeTexture(scene, key, w, h, ctx => drawProp(ctx, w, h, style, colors));
  return key;
}

export type PlatformStyle = 'wood' | 'cloud' | 'stone' | 'candy' | 'crystal' | 'leaf';

function drawPlatform(ctx: Ctx, w: number, style: PlatformStyle, c: PropColors): void {
  softShadow(ctx, 5, 3, 'rgba(30,10,50,0.25)');
  switch (style) {
    case 'wood':
      roundRect(ctx, 2, 6, w - 4, 18, 6); fillStroke(ctx, lin(ctx, 0, 6, 0, 24, [[0, c.light], [1, c.main]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.strokeStyle = c.dark; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
      for (let x = 30; x < w - 10; x += 34) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, 22); ctx.stroke(); }
      ctx.globalAlpha = 1;
      for (let x = 14; x < w - 8; x += 34) { circle(ctx, x, 15, 2); ctx.fillStyle = '#5a4a3a'; ctx.fill(); }
      break;
    case 'cloud':
      ctx.fillStyle = lin(ctx, 0, 0, 0, 30, [[0, '#ffffff'], [1, '#d6e6fb']]);
      roundRect(ctx, 6, 12, w - 12, 15, 8); ctx.fill();
      for (let x = 18; x < w - 10; x += 26) { circle(ctx, x, 13, 11); ctx.fill(); }
      noShadow(ctx);
      for (let x = 18; x < w - 10; x += 52) gloss(ctx, x - 3, 8, 6, 2.5, 0.9, 0);
      break;
    case 'stone':
      roundRect(ctx, 2, 6, w - 4, 20, 5); fillStroke(ctx, lin(ctx, 0, 6, 0, 26, [[0, c.light], [0.3, c.main], [1, c.dark]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.strokeStyle = c.dark; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
      for (let x = 26; x < w - 8; x += 30) { ctx.beginPath(); ctx.moveTo(x, 8); ctx.lineTo(x, 24); ctx.stroke(); }
      ctx.globalAlpha = 1;
      roundRect(ctx, 6, 8, w - 12, 4, 2); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
      break;
    case 'candy':
      roundRect(ctx, 2, 6, w - 4, 18, 9);
      ctx.save(); ctx.clip();
      ctx.fillStyle = c.light; ctx.fillRect(0, 0, w, 30);
      ctx.fillStyle = c.main;
      for (let x = -20; x < w + 20; x += 16) { ctx.beginPath(); ctx.moveTo(x, 24); ctx.lineTo(x + 8, 24); ctx.lineTo(x + 26, 6); ctx.lineTo(x + 18, 6); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      noShadow(ctx);
      roundRect(ctx, 2, 6, w - 4, 18, 9); ctx.strokeStyle = c.dark; ctx.lineWidth = 2.5; ctx.stroke();
      gloss(ctx, w * 0.35, 10, w * 0.25, 2.5, 0.85, 0);
      break;
    case 'crystal':
      softShadow(ctx, 10, 0, c.accent);
      roundRect(ctx, 2, 8, w - 4, 16, 8); fillStroke(ctx, lin(ctx, 0, 8, 0, 24, [[0, c.light], [1, c.main]]), c.dark, 2.2);
      noShadow(ctx);
      for (let x = 16; x < w - 8; x += 28) { star(ctx, x, 16, 4, 1.6, 4); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); }
      break;
    case 'leaf':
      roundRect(ctx, 2, 8, w - 4, 16, 8); fillStroke(ctx, lin(ctx, 0, 8, 0, 24, [[0, c.light], [1, c.main]]), c.dark, 2.5);
      noShadow(ctx);
      ctx.fillStyle = c.light;
      for (let x = 10; x < w - 6; x += 18) { ellipse(ctx, x, 8, 8, 4, -0.3); ctx.fill(); }
      for (let x = 22; x < w - 6; x += 40) { circle(ctx, x, 6, 3); ctx.fillStyle = c.accent; ctx.fill(); ctx.fillStyle = c.light; }
      break;
  }
  noShadow(ctx);
}

export function platformTexture(scene: Phaser.Scene, theme: string, w: number, style: PlatformStyle, colors: PropColors): string {
  const key = `plat-${theme}-${style}-${w}`;
  makeTexture(scene, key, w, 30, ctx => drawPlatform(ctx, w, style, colors));
  return key;
}

export function gateTexture(scene: Phaser.Scene, main: string, dark: string, style: GateStyle): string {
  const key = `gate-${style}-${main}`;
  makeTexture(scene, key, 120, 260, ctx => drawGate(ctx, main, dark, style));
  return key;
}

/** Remove themed prop/platform textures that belong to other themes (saves iPad GPU memory). */
export function freeThemeProps(scene: Phaser.Scene, keep: string): void {
  for (const key of scene.textures.getTextureKeys()) {
    if ((key.startsWith('prop-') || key.startsWith('plat-')) && !key.startsWith(`prop-${keep}-`) && !key.startsWith(`plat-${keep}-`)) {
      scene.textures.remove(key);
    }
  }
}

// ---------------------------------------------------------------- UI pieces

/** Glossy rounded button face (cached per size and colour). */
export function buttonTexture(scene: Phaser.Scene, w: number, h: number, color: number, pressed: boolean): string {
  const key = `btn-${w}x${h}-${color.toString(16)}-${pressed ? 'p' : 'n'}`;
  const base = Phaser.Display.Color.IntegerToColor(color);
  const light = base.clone().lighten(18).rgba;
  const mid = base.rgba;
  const dark = base.clone().darken(22).rgba;
  const r = Math.min(22, h / 2);
  makeTexture(scene, key, w + 8, h + 12, ctx => {
    const y = pressed ? 4 : 0;
    // Drop lip + soft shadow.
    softShadow(ctx, 6, 3, 'rgba(30,10,60,0.35)');
    roundRect(ctx, 4, 6, w, h, r); ctx.fillStyle = dark; ctx.fill();
    noShadow(ctx);
    roundRect(ctx, 4, 2 + y, w, h, r);
    ctx.fillStyle = lin(ctx, 0, 2 + y, 0, 2 + y + h, [[0, light], [0.55, mid], [1, dark]]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5; ctx.stroke();
    // Glossy top band.
    roundRect(ctx, 10, 6 + y, w - 12, h * 0.38, r * 0.8);
    ctx.fillStyle = lin(ctx, 0, 6 + y, 0, 6 + y + h * 0.38, [[0, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0.05)']]); ctx.fill();
  });
  return key;
}

/** Soft rounded panel with border and drop shadow (cached per size). */
export function panelTexture(scene: Phaser.Scene, w: number, h: number): string {
  const key = `panel-${w}x${h}`;
  makeTexture(scene, key, w + 40, h + 40, ctx => {
    softShadow(ctx, 18, 8, 'rgba(20,6,40,0.45)');
    roundRect(ctx, 20, 18, w, h, 28);
    ctx.fillStyle = lin(ctx, 0, 18, 0, 18 + h, [[0, '#fffaff'], [1, '#f6e9ff']]); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = '#f2bde4'; ctx.lineWidth = 5; ctx.stroke();
    roundRect(ctx, 28, 26, w - 16, h - 16, 22); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2; ctx.stroke();
  });
  return key;
}

// ---------------------------------------------------------------- core art

/** Characters and shared objects used by every scene. */
export function generateCoreArt(scene: Phaser.Scene): void {
  const poses: BunnyPose[] = ['run0', 'run1', 'run2', 'run3', 'jump', 'stand', 'cheer'];
  for (const pose of poses) makeTexture(scene, `lyla-${pose}`, 120, 122, ctx => drawBunny(ctx, LYLA, pose));
  for (const pose of ['run0', 'run1', 'run2', 'run3', 'stand', 'cheer'] as BunnyPose[]) {
    makeTexture(scene, `ridensee-${pose}`, 120, 122, ctx => drawBunny(ctx, RIDENSEE, pose));
  }
  makeTexture(scene, 'police', 120, 122, ctx => { drawBunny(ctx, POLICE, 'stand'); drawPoliceHat(ctx); });
  makeTexture(scene, 'police-cheer', 120, 122, ctx => { drawBunny(ctx, POLICE, 'cheer'); drawPoliceHat(ctx); });
  makeTexture(scene, 'tiger', 170, 120, ctx => drawTiger(ctx, false));
  makeTexture(scene, 'tiger-leap', 170, 120, ctx => drawTiger(ctx, true));
  makeTexture(scene, 'monkey', 100, 110, ctx => drawMonkey(ctx, false));
  makeTexture(scene, 'monkey-grab', 100, 110, ctx => drawMonkey(ctx, true));
  makeTexture(scene, 'hand', 140, 124, drawHand);
  makeTexture(scene, 'king', 160, 176, drawKing);
  makeTexture(scene, 'monster', 320, 326, ctx => drawMonster(ctx, false));
  makeTexture(scene, 'monster-friendly', 120, 124, ctx => drawMonster(ctx, true));

  // Soft ground shadow for characters.
  makeTexture(scene, 'shadow', 90, 22, ctx => {
    ellipse(ctx, 45, 11, 44, 10);
    ctx.fillStyle = rad(ctx, 45, 11, 44, [[0, 'rgba(40,16,70,0.38)'], [0.6, 'rgba(40,16,70,0.18)'], [1, 'rgba(40,16,70,0)']]);
    ctx.fill();
  });

  // Rescue scene backdrop (small, drawn soft, displayed full screen).
  makeTexture(scene, 'rescue-bg', 480, 270, ctx => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 270, [[0, '#ffe2f2'], [0.6, '#ffc2e3'], [1, '#f79ccd']]); ctx.fillRect(0, 0, 480, 270);
    ctx.save(); ctx.globalAlpha = 0.25;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(240, -20); ctx.lineTo(i * 96 - 40, 270); ctx.lineTo(i * 96 + 8, 270); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
    circle(ctx, 240, 120, 150); ctx.fillStyle = rad(ctx, 240, 120, 150, [[0, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    ctx.fillStyle = lin(ctx, 0, 220, 0, 270, [[0, '#e86aac'], [1, '#c8408c']]); ctx.fillRect(0, 222, 480, 48);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(0, 222, 480, 3);
    for (let i = 0; i < 18; i++) { star(ctx, (i * 131) % 480, 20 + ((i * 53) % 180), 3 + (i % 3), 1.2, 4); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill(); }
  });

  // HUD pieces.
  makeTexture(scene, 'hud-pill', 140, 58, ctx => {
    softShadow(ctx, 6, 2, 'rgba(60,10,50,0.3)');
    roundRect(ctx, 4, 4, 132, 50, 25);
    ctx.fillStyle = lin(ctx, 0, 4, 0, 54, [[0, '#ffffff'], [1, '#ffe6f4']]); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = '#ff7ac0'; ctx.lineWidth = 3; ctx.stroke();
    roundRect(ctx, 10, 8, 120, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  });
  makeTexture(scene, 'hud-bar', 320, 22, ctx => {
    softShadow(ctx, 4, 1.5, 'rgba(60,10,50,0.3)');
    roundRect(ctx, 4, 3, 312, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill();
    noShadow(ctx);
    roundRect(ctx, 10, 7, 300, 8, 4);
    ctx.fillStyle = lin(ctx, 10, 0, 310, 0, [[0, '#ffc2e3'], [0.5, '#d9c6ef'], [1, '#b8a6ff']]); ctx.fill();
  });

  makeTexture(scene, 'flower', 44, 52, ctx => drawFlower(ctx, '#ff6fb8', '#ffd2ea', 44));
  makeTexture(scene, 'flower-b', 44, 52, ctx => drawFlower(ctx, '#9b72ff', '#e2d6ff', 44));
  makeTexture(scene, 'flower-c', 44, 52, ctx => drawFlower(ctx, '#ffa53d', '#ffe3b8', 44));
  makeTexture(scene, 'flower-icon', 40, 40, ctx => { ctx.translate(0, -2); drawFlower(ctx, '#ff6fb8', '#ffd2ea', 40, false); });
  makeTexture(scene, 'magic-flower', 150, 190, ctx => {
    circle(ctx, 75, 70, 75);
    ctx.fillStyle = rad(ctx, 75, 70, 75, [[0, 'rgba(255,240,170,0.8)'], [0.5, 'rgba(255,170,220,0.35)'], [1, 'rgba(255,170,220,0)']]); ctx.fill();
    ctx.save(); ctx.translate(0, 20); drawFlower(ctx, '#ff3f9e', '#ffd0e8', 150, false); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.95;
    for (const [x, y, s] of [[20, 30, 9], [128, 40, 8], [30, 120, 6], [122, 118, 7], [75, 8, 6]]) { star(ctx, x, y, s, s * 0.38, 4); ctx.fill(); }
    ctx.globalAlpha = 1;
  });
  makeTexture(scene, 'portal', 150, 150, ctx => drawPortal(ctx, 150));
  makeTexture(scene, 'portal-glow', 220, 220, ctx => {
    circle(ctx, 110, 110, 110);
    ctx.fillStyle = rad(ctx, 110, 110, 110, [[0, 'rgba(160,140,255,0.55)'], [0.55, 'rgba(110,170,255,0.22)'], [1, 'rgba(110,170,255,0)']]); ctx.fill();
  });
  makeTexture(scene, 'cage', 160, 186, ctx => drawCage(ctx, false));
  makeTexture(scene, 'cage-open', 160, 186, ctx => drawCage(ctx, true));

  // Particles and effects.
  makeTexture(scene, 'sparkle', 24, 24, ctx => {
    circle(ctx, 12, 12, 11); ctx.fillStyle = rad(ctx, 12, 12, 11, [[0, 'rgba(255,255,255,0.7)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    star(ctx, 12, 12, 11, 3.6, 4); ctx.fillStyle = '#ffffff'; ctx.fill();
  });
  makeTexture(scene, 'sparkle-gold', 24, 24, ctx => {
    circle(ctx, 12, 12, 11); ctx.fillStyle = rad(ctx, 12, 12, 11, [[0, 'rgba(255,230,120,0.7)'], [1, 'rgba(255,230,120,0)']]); ctx.fill();
    star(ctx, 12, 12, 11, 3.6, 4); ctx.fillStyle = lin(ctx, 0, 1, 0, 23, [[0, '#fffbe0'], [1, '#ffd23f']]); ctx.fill();
  });
  makeTexture(scene, 'dot', 12, 12, ctx => {
    circle(ctx, 6, 6, 6); ctx.fillStyle = rad(ctx, 6, 6, 6, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
  });
  makeTexture(scene, 'dust', 28, 28, ctx => {
    circle(ctx, 14, 14, 13); ctx.fillStyle = rad(ctx, 14, 14, 13, [[0, 'rgba(255,255,255,0.9)'], [0.6, 'rgba(240,230,250,0.6)'], [1, 'rgba(240,230,250,0)']]); ctx.fill();
  });
  makeTexture(scene, 'petal', 16, 12, ctx => { ellipse(ctx, 8, 6, 7, 4.5, 0.4); ctx.fillStyle = lin(ctx, 0, 0, 16, 12, [[0, '#ffe0f0'], [1, '#ff8cc6']]); ctx.fill(); });
  makeTexture(scene, 'leaf', 16, 12, ctx => {
    ellipse(ctx, 8, 6, 7, 4, -0.4); ctx.fillStyle = lin(ctx, 0, 0, 16, 12, [[0, '#b6e86a'], [1, '#4f9a3a']]); ctx.fill();
    ctx.strokeStyle = 'rgba(40,90,20,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(2, 9); ctx.lineTo(14, 3); ctx.stroke();
  });
  makeTexture(scene, 'firefly', 20, 20, ctx => {
    circle(ctx, 10, 10, 10); ctx.fillStyle = rad(ctx, 10, 10, 10, [[0, 'rgba(255,250,190,1)'], [0.3, 'rgba(255,240,140,0.7)'], [1, 'rgba(255,240,140,0)']]); ctx.fill();
  });
  makeTexture(scene, 'bubble', 18, 18, ctx => {
    circle(ctx, 9, 9, 7.5); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
    gloss(ctx, 6.5, 6, 2.5, 1.6, 0.9, -0.6);
  });
  makeTexture(scene, 'confetti', 10, 6, ctx => { roundRect(ctx, 0, 0, 10, 6, 2); ctx.fillStyle = '#ffffff'; ctx.fill(); });
  makeTexture(scene, 'ring', 64, 64, ctx => {
    circle(ctx, 32, 32, 28); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4; ctx.stroke();
  });
  makeTexture(scene, 'speedline', 80, 8, ctx => {
    roundRect(ctx, 0, 1, 80, 6, 3); ctx.fillStyle = lin(ctx, 0, 0, 80, 0, [[0, 'rgba(190,224,255,0)'], [1, 'rgba(190,224,255,1)']]); ctx.fill();
  });

  for (const [name, col, light, dark] of [['bead-a', '#ff6fa8', '#ffd0e4', '#c0407a'], ['bead-b', '#6fc8ff', '#d6f0ff', '#2f88c0'], ['bead-c', '#ffd84d', '#fff6c8', '#c0a020']]) {
    makeTexture(scene, name, 30, 30, ctx => {
      softShadow(ctx, 3, 1.5, 'rgba(40,20,60,0.35)');
      circle(ctx, 15, 15, 12); fillStroke(ctx, rad(ctx, 15, 15, 12, [[0, light], [0.6, col], [1, dark]], 11, 10), dark, 2);
      noShadow(ctx);
      circle(ctx, 15, 15, 3.8); ctx.fillStyle = dark; ctx.fill();
      gloss(ctx, 10.5, 9.5, 4, 2.6, 0.95, -0.6);
    });
  }
  const flagPole = (ctx: Ctx): void => {
    roundRect(ctx, 11, 12, 6, 108, 3); ctx.fillStyle = lin(ctx, 11, 0, 17, 0, [[0, '#5a3a1e'], [0.5, '#a07a50'], [1, '#5a3a1e']]); ctx.fill();
    circle(ctx, 14, 12, 4.5); ctx.fillStyle = rad(ctx, 14, 12, 4.5, [[0, '#fff6b8'], [1, '#d9a21c']], 13, 11); ctx.fill();
  };
  makeTexture(scene, 'checkpoint', 60, 120, ctx => {
    flagPole(ctx);
    ctx.beginPath(); ctx.moveTo(17, 16); ctx.quadraticCurveTo(36, 22, 56, 26); ctx.quadraticCurveTo(36, 34, 17, 42); ctx.closePath();
    fillStroke(ctx, lin(ctx, 17, 0, 56, 0, [[0, '#cbb6ea'], [1, '#efe6ff']]), '#8a6ab0', 1.8);
  });
  makeTexture(scene, 'checkpoint-on', 60, 120, ctx => {
    flagPole(ctx);
    softShadow(ctx, 6, 0, 'rgba(255,120,190,0.7)');
    ctx.beginPath(); ctx.moveTo(17, 16); ctx.quadraticCurveTo(36, 22, 56, 26); ctx.quadraticCurveTo(36, 34, 17, 42); ctx.closePath();
    fillStroke(ctx, lin(ctx, 17, 0, 56, 0, [[0, '#ff4fa0'], [1, '#ff9fd0']]), '#c0407a', 1.8);
    noShadow(ctx);
    ctx.save(); ctx.translate(20, 10); ctx.scale(0.5, 0.5); drawFlower(ctx, '#ffd84d', '#fff6c8', 40, false); ctx.restore();
  });
  makeTexture(scene, 'bush', 170, 110, ctx => {
    softShadow(ctx, 6, 3, 'rgba(20,60,30,0.3)');
    const leafy = (x: number, y: number, r: number): void => {
      circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x, y, r, [[0, '#7fd98f'], [0.6, '#4bb062'], [1, '#2f8a48']], x - r * 0.35, y - r * 0.45); ctx.fill();
    };
    for (const [x, y, r] of [[40, 72, 38], [130, 72, 38], [85, 52, 46], [85, 82, 40]]) leafy(x, y, r);
    noShadow(ctx);
    for (const [x, y, r] of [[60, 50, 12], [100, 36, 14], [130, 58, 10]]) gloss(ctx, x, y, r, r * 0.6, 0.35, -0.3);
    for (const [x, y] of [[44, 60], [92, 30], [140, 76], [74, 88], [116, 58]]) {
      for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(ctx, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, 2.8); ctx.fillStyle = '#ff7ac0'; ctx.fill(); }
      circle(ctx, x, y, 2); ctx.fillStyle = '#ffe066'; ctx.fill();
    }
  });
  makeTexture(scene, 'tree', 180, 330, ctx => {
    softShadow(ctx, 6, 3, 'rgba(40,20,0,0.25)');
    roundRect(ctx, 74, 120, 32, 210, 10); fillStroke(ctx, lin(ctx, 74, 0, 106, 0, [[0, '#6a4220'], [0.45, '#b07a44'], [1, '#5a3a1a']]), '#4a2e12', 2.5);
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(40,20,0,0.3)'; ctx.lineWidth = 1.5;
    for (let y = 140; y < 320; y += 18) { ctx.beginPath(); ctx.moveTo(80, y); ctx.quadraticCurveTo(90, y + 5, 100, y); ctx.stroke(); }
    ctx.strokeStyle = '#7a4a1c'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(90, 160); ctx.quadraticCurveTo(130, 130, 150, 128); ctx.stroke();
    softShadow(ctx, 8, 4, 'rgba(20,60,30,0.3)');
    for (const [x, y, r] of [[40, 100, 44], [140, 100, 44], [90, 120, 50], [90, 70, 70]]) {
      circle(ctx, x, y, r); ctx.fillStyle = rad(ctx, x, y, r, [[0, '#7fd98f'], [0.6, '#46a85c'], [1, '#2a7a40']], x - r * 0.35, y - r * 0.45); ctx.fill();
    }
    noShadow(ctx);
    for (const [x, y, r] of [[70, 46, 18], [118, 70, 14], [48, 92, 11]]) gloss(ctx, x, y, r, r * 0.6, 0.35, -0.3);
  });
  makeTexture(scene, 'bow', 90, 110, ctx => {
    softShadow(ctx, 4, 2, 'rgba(90,40,0,0.35)');
    ctx.strokeStyle = lin(ctx, 0, 5, 0, 105, [[0, '#8a5420'], [0.5, '#e0a050'], [1, '#8a5420']]); ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(10, 55, 50, -1.1, 1.1); ctx.stroke();
    noShadow(ctx);
    ctx.strokeStyle = '#ffe680'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(10, 55, 50, -1.0, 1.0); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.1) * 50, 55 + Math.sin(-1.1) * 50); ctx.lineTo(10 + Math.cos(1.1) * 50, 55 + Math.sin(1.1) * 50); ctx.stroke();
    star(ctx, 60, 55, 10, 4); ctx.fillStyle = lin(ctx, 0, 45, 0, 65, [[0, '#ffc2e3'], [1, '#ff4fa0']]); ctx.fill();
  });
  makeTexture(scene, 'pedestal', 120, 90, ctx => {
    softShadow(ctx, 6, 3, 'rgba(60,30,90,0.3)');
    const marble = lin(ctx, 0, 0, 120, 0, [[0, '#c9b3e6'], [0.4, '#f6efff'], [1, '#b49ad8']]);
    roundRect(ctx, 34, 28, 52, 52, 4); fillStroke(ctx, marble, '#8a6ab0', 2);
    noShadow(ctx);
    roundRect(ctx, 20, 10, 80, 20, 6); fillStroke(ctx, marble, '#8a6ab0', 2);
    roundRect(ctx, 14, 76, 92, 14, 6); fillStroke(ctx, marble, '#8a6ab0', 2);
  });
  makeTexture(scene, 'arrow', 70, 16, ctx => {
    ctx.strokeStyle = lin(ctx, 0, 6, 0, 10, [[0, '#c08a50'], [1, '#7a4a1a']]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(58, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(56, 1); ctx.lineTo(70, 8); ctx.lineTo(56, 15); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, 1, 0, 15, [[0, '#ffffff'], [1, '#9aa0b8']]); ctx.fill();
    ctx.fillStyle = '#ff6fb5'; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(14, 8); ctx.lineTo(2, 14); ctx.closePath(); ctx.fill();
  });
  makeTexture(scene, 'rainbow-arrow', 90, 22, ctx => {
    softShadow(ctx, 8, 0, 'rgba(255,255,255,0.9)');
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, 2 + i * 3, 70, 3); });
    ctx.beginPath(); ctx.moveTo(68, 0); ctx.lineTo(90, 11); ctx.lineTo(68, 22); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
    noShadow(ctx);
  });
  makeTexture(scene, 'target', 100, 100, ctx => {
    softShadow(ctx, 5, 2, 'rgba(90,30,70,0.35)');
    ['#ffffff', '#ff6fb5', '#ffffff', '#ff6fb5', '#ffd84d'].forEach((c, i) => {
      circle(ctx, 50, 50, 46 - i * 9);
      fillStroke(ctx, rad(ctx, 50, 50, 46 - i * 9, [[0, c], [1, i % 2 ? '#d23f8c' : '#efe2ec']], 42, 40), '#8a3a6a', 1.6);
      if (i === 0) noShadow(ctx);
    });
    gloss(ctx, 36, 32, 12, 6, 0.6, -0.6);
  });
  makeTexture(scene, 'star-target', 90, 90, ctx => {
    circle(ctx, 45, 47, 44); ctx.fillStyle = rad(ctx, 45, 47, 44, [[0, 'rgba(255,240,150,0.55)'], [1, 'rgba(255,240,150,0)']]); ctx.fill();
    star(ctx, 45, 47, 40, 18); fillStroke(ctx, rad(ctx, 45, 47, 40, [[0, '#fffbe0'], [0.5, '#ffe066'], [1, '#e0a91c']], 38, 36), '#b8800e', 3.5);
    star(ctx, 45, 47, 20, 9); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
  });
  makeTexture(scene, 'heart-target', 120, 110, ctx => {
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    softShadow(ctx, 14, 0, 'rgba(255,255,255,0.95)');
    cols.forEach((c, i) => {
      const s = 1 - i * 0.13;
      ctx.save(); ctx.translate(60, 56); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(-70, -6, -34, -56, 0, -20); ctx.bezierCurveTo(34, -56, 70, -6, 0, 44); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.restore();
      if (i === 0) noShadow(ctx);
    });
    gloss(ctx, 40, 34, 12, 6, 0.75, -0.6);
  });
  makeTexture(scene, 'phone-big', 150, 250, ctx => {
    softShadow(ctx, 14, 0, 'rgba(110,220,255,0.75)');
    roundRect(ctx, 4, 4, 142, 242, 22); fillStroke(ctx, lin(ctx, 0, 0, 150, 0, [[0, '#1a1a28'], [0.5, '#3a3a52'], [1, '#14141e']]), '#0a0a12', 4);
    noShadow(ctx);
    roundRect(ctx, 16, 26, 118, 190, 8); ctx.fillStyle = lin(ctx, 0, 26, 0, 216, [[0, '#d6f8ff'], [1, '#5fcfff']]); ctx.fill();
    ctx.fillStyle = '#2e5f99'; ctx.font = 'bold 18px "Avenir Next", Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ROBOT', 75, 80); ctx.fillText('BUNNY', 75, 102); ctx.fillText('CONTROL', 75, 124);
    for (const [x, y, c] of [[48, 160, '#ff6fb5'], [102, 160, '#ffd84d'], [48, 196, '#4fd17a'], [102, 196, '#9b6bff']] as const) {
      circle(ctx, x, y, 14); ctx.fillStyle = rad(ctx, x, y, 14, [[0, '#ffffff'], [0.35, c], [1, c]], x - 5, y - 5); ctx.fill();
    }
    ctx.save(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(16, 26); ctx.lineTo(80, 26); ctx.lineTo(16, 140); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore();
    circle(ctx, 75, 232, 8); ctx.strokeStyle = '#7a7a90'; ctx.lineWidth = 2; ctx.stroke();
  });
  const paints = [['#ff5a5a', '#ffb0b0'], ['#ff9f43', '#ffd2a6'], ['#ffd84d', '#fff2b0'], ['#4fd17a', '#b6f0c8'], ['#4fb3ff', '#bfe4ff'], ['#9b6bff', '#d8c8ff']];
  paints.forEach(([c, light], i) => {
    makeTexture(scene, `paint-${i}`, 80, 84, ctx => {
      softShadow(ctx, 4, 2, 'rgba(40,20,60,0.3)');
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(16, 76); ctx.quadraticCurveTo(40, 86, 64, 76); ctx.lineTo(70, 18); ctx.closePath();
      fillStroke(ctx, lin(ctx, 10, 0, 70, 0, [[0, '#d8d8e8'], [0.4, '#ffffff'], [1, '#c8c8dc']]), '#5a3a6a', 2.2);
      noShadow(ctx);
      ellipse(ctx, 40, 18, 30, 9); fillStroke(ctx, rad(ctx, 40, 18, 30, [[0, light], [1, c]]), '#5a3a6a', 2.2);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(12, 30); ctx.lineTo(68, 30); ctx.lineTo(66, 48); ctx.lineTo(14, 48); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(24, 18); ctx.quadraticCurveTo(20, 40, 26, 44); ctx.quadraticCurveTo(30, 36, 30, 20); ctx.fill();
      gloss(ctx, 24, 54, 4, 12, 0.6, 0);
    });
    makeTexture(scene, `splat-${i}`, 64, 64, ctx => {
      ctx.fillStyle = rad(ctx, 32, 32, 30, [[0, light], [0.5, c], [1, c]], 26, 26);
      circle(ctx, 32, 32, 20); ctx.fill();
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + i; circle(ctx, 32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22, 7 + (k % 3) * 2); ctx.fill(); }
      gloss(ctx, 26, 25, 6, 3.5, 0.7, -0.6);
    });
  });
  makeTexture(scene, 'paint-door', 150, 270, ctx => {
    softShadow(ctx, 10, 4, 'rgba(60,30,90,0.3)');
    roundRect(ctx, 4, 4, 142, 262, 60); fillStroke(ctx, lin(ctx, 0, 0, 150, 0, [[0, '#efe6ff'], [0.5, '#ffffff'], [1, '#e6dcf8']]), '#6a3d92', 5);
    noShadow(ctx);
    for (let i = 0; i < 6; i++) { circle(ctx, 75, 46 + i * 38, 15); ctx.strokeStyle = '#c9b3e6'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); }
  });
}
