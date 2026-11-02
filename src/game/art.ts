/**
 * All game art is drawn here with Canvas 2D at boot: original shapes, no
 * external images, fonts or licensed media. Characters follow Zoey's canon:
 * Lyla is a fluffy WHITE bunny with a PINK fanny pack who never looks robotic;
 * Ridensee is a BLUE boy bunny with a GREEN fanny pack.
 */
import Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;

export function makeTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: Ctx) => void): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  draw(ctx);
  tex.refresh();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(rx, 0.5), Math.max(ry, 0.5), rot, 0, Math.PI * 2);
}

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fillStroke(ctx: Ctx, fill: string, stroke?: string, width = 3): void {
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
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

// ---------------------------------------------------------------- bunnies

export interface BunnyLook {
  fur: string;
  shade: string;
  outline: string;
  inner: string;
  pack: string;
  packDark: string;
}

export const LYLA: BunnyLook = {
  fur: '#ffffff', shade: '#efe9f6', outline: '#8f7fa6', inner: '#ffb3d1', pack: '#ff5fae', packDark: '#d63f8c'
};
export const RIDENSEE: BunnyLook = {
  fur: '#5aa9ff', shade: '#3d8be6', outline: '#2a5c9e', inner: '#bfe0ff', pack: '#3ccf6a', packDark: '#249a4c'
};
export const POLICE: BunnyLook = {
  fur: '#d9c3a5', shade: '#c4ab8a', outline: '#7d6650', inner: '#ffc9c9', pack: '#2f4f9e', packDark: '#1f3670'
};

type BunnyPose = 'run0' | 'run1' | 'run2' | 'run3' | 'jump' | 'stand' | 'cheer';

/** Side-view bunny facing right in a 120×120 box, feet on y≈116. */
function drawBunny(ctx: Ctx, look: BunnyLook, pose: BunnyPose): void {
  const o = look.outline;
  const bob = pose === 'run1' || pose === 'run3' ? -3 : 0;
  const lift = pose === 'jump' ? -6 : pose === 'cheer' ? -4 : 0;
  ctx.save();
  ctx.translate(0, bob + lift);

  // Back leg + foot (frame-dependent).
  const backFoot: Record<BunnyPose, [number, number, number]> = {
    run0: [30, 109, -0.25], run1: [40, 111, 0], run2: [52, 110, 0.15], run3: [36, 105, -0.4],
    jump: [26, 104, -0.6], stand: [40, 111, 0], cheer: [40, 111, 0]
  };
  const [bx, by, br] = backFoot[pose];
  ellipse(ctx, bx, by, 17, 7, br); fillStroke(ctx, look.shade, o);

  // Tail puff.
  circle(ctx, 22, 80, 10); fillStroke(ctx, look.fur, o);
  for (const [tx, ty] of [[16, 76], [19, 86], [27, 73]]) { circle(ctx, tx, ty, 4); ctx.fillStyle = look.fur; ctx.fill(); }

  // Back ear (behind head).
  const earSwing = pose === 'jump' ? -0.35 : pose === 'cheer' ? 0.1 : (pose === 'run1' || pose === 'run3') ? -0.12 : -0.2;
  ellipse(ctx, 56, 30, 9, 27, earSwing - 0.15); fillStroke(ctx, look.shade, o);

  // Body.
  ellipse(ctx, 52, 84, 31, 25); fillStroke(ctx, look.fur, o);
  // Fluffy tufts along the back.
  ctx.fillStyle = look.fur;
  for (const [fx, fy, fr] of [[30, 66, 6], [40, 61, 6], [52, 59, 6], [24, 76, 5]]) { circle(ctx, fx, fy, fr); ctx.fill(); }
  ctx.strokeStyle = o; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(30, 66, 6, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(40, 61, 6, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke();
  ctx.beginPath(); ctx.arc(52, 59, 6, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke();
  // Belly shade.
  ellipse(ctx, 58, 93, 18, 11); ctx.fillStyle = look.shade; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;

  // Fanny pack: strap and pouch.
  ctx.strokeStyle = look.packDark; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(26, 82); ctx.quadraticCurveTo(52, 94, 80, 84); ctx.stroke();
  roundRect(ctx, 52, 82, 26, 17, 6); fillStroke(ctx, look.pack, look.packDark, 2.5);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(55, 88); ctx.lineTo(75, 88); ctx.stroke(); ctx.globalAlpha = 1;
  circle(ctx, 72, 88, 2); ctx.fillStyle = '#ffe680'; ctx.fill();

  // Front foot.
  const frontFoot: Record<BunnyPose, [number, number]> = {
    run0: [76, 112], run1: [68, 111], run2: [60, 112], run3: [80, 106], jump: [84, 102], stand: [70, 112], cheer: [70, 112]
  };
  const [ffx, ffy] = frontFoot[pose];
  ellipse(ctx, ffx, ffy, 12, 6, 0.1); fillStroke(ctx, look.fur, o);

  // Head.
  circle(ctx, 76, 58, 23); fillStroke(ctx, look.fur, o);
  circle(ctx, 66, 70, 9); ctx.fillStyle = look.fur; ctx.fill(); // cheek fluff
  // Front ear.
  ellipse(ctx, 70, 24, 10, 28, earSwing + 0.1); fillStroke(ctx, look.fur, o);
  ellipse(ctx, 70.5, 26, 4.5, 19, earSwing + 0.1); ctx.fillStyle = look.inner; ctx.fill();

  // Front paw (raised when cheering).
  if (pose === 'cheer') { ellipse(ctx, 84, 62, 7, 10, -0.5); fillStroke(ctx, look.fur, o, 2.5); }
  else { ellipse(ctx, 78, 98, 7, 9, 0.3); fillStroke(ctx, look.fur, o, 2.5); }

  // Face.
  circle(ctx, 85, 54, 4.6); ctx.fillStyle = '#3a2547'; ctx.fill();
  circle(ctx, 86.6, 52.4, 1.7); ctx.fillStyle = '#ffffff'; ctx.fill();
  circle(ctx, 84, 65, 4.5); ctx.fillStyle = look.inner; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; // blush
  circle(ctx, 97.5, 60, 3.2); ctx.fillStyle = '#ff8fbf'; ctx.fill();
  ctx.strokeStyle = o; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(97, 63); ctx.quadraticCurveTo(95, 67, 91, 67); ctx.stroke();
  // Whiskers.
  ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(95, 62); ctx.lineTo(108, 59); ctx.moveTo(95, 64); ctx.lineTo(108, 66); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPoliceHat(ctx: Ctx): void {
  ctx.save();
  roundRect(ctx, 58, 30, 36, 14, 5); fillStroke(ctx, '#2f4f9e', '#1f3670', 2.5);
  ctx.fillStyle = '#1f3670'; ctx.fillRect(56, 42, 44, 5);
  star(ctx, 76, 37, 5, 2.4); ctx.fillStyle = '#ffd84d'; ctx.fill();
  // Badge on the chest.
  star(ctx, 70, 86, 6, 3); ctx.fillStyle = '#ffd84d'; ctx.fill(); ctx.strokeStyle = '#b8932a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- others

function drawTiger(ctx: Ctx, leaping: boolean): void {
  const o = '#8a4a12';
  ctx.save();
  if (leaping) { ctx.translate(80, 60); ctx.rotate(-0.18); ctx.translate(-80, -60); }
  // Tail.
  ctx.strokeStyle = o; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(30, 62); ctx.quadraticCurveTo(6, 40, 14, 22); ctx.stroke();
  ctx.strokeStyle = '#ff9a3c'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(30, 62); ctx.quadraticCurveTo(6, 40, 14, 22); ctx.stroke();
  // Legs.
  const legs = leaping ? [[40, 92, -0.7], [58, 92, -0.5], [104, 86, 0.8], [118, 84, 0.9]] : [[42, 100, 0], [60, 100, 0], [102, 100, 0], [118, 100, 0]];
  for (const [lx, ly, lr] of legs) { ellipse(ctx, lx, ly, 8, 15, lr); fillStroke(ctx, '#ff9a3c', o); }
  // Body.
  ellipse(ctx, 80, 70, 52, 27); fillStroke(ctx, '#ff9a3c', o);
  ellipse(ctx, 84, 82, 34, 11); ctx.fillStyle = '#fff1dc'; ctx.fill();
  ctx.strokeStyle = '#3b2412'; ctx.lineWidth = 4;
  for (const sx of [50, 66, 82, 98]) { ctx.beginPath(); ctx.moveTo(sx, 46); ctx.quadraticCurveTo(sx + 5, 56, sx - 1, 64); ctx.stroke(); }
  // Head.
  circle(ctx, 134, 54, 25); fillStroke(ctx, '#ff9a3c', o);
  for (const ex of [118, 146]) { circle(ctx, ex, 33, 8); fillStroke(ctx, '#ff9a3c', o); circle(ctx, ex, 33, 3.5); ctx.fillStyle = '#ffd9b8'; ctx.fill(); }
  ellipse(ctx, 142, 64, 13, 9); ctx.fillStyle = '#fff1dc'; ctx.fill();
  circle(ctx, 140, 47, 4.5); ctx.fillStyle = '#2b1a0c'; ctx.fill();
  circle(ctx, 141.5, 45.5, 1.6); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(133, 39); ctx.lineTo(146, 42); ctx.stroke(); // sneaky brow
  circle(ctx, 154, 60, 4); ctx.fillStyle = '#c8556b'; ctx.fill();
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(152, 66); ctx.quadraticCurveTo(146, 71, 140, 67); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(122, 50); ctx.lineTo(128, 56); ctx.moveTo(124, 64); ctx.lineTo(130, 62); ctx.stroke();
  ctx.restore();
}

function drawMonkey(ctx: Ctx, grabbing: boolean): void {
  const o = '#5a3618';
  ctx.strokeStyle = o; ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(30, 66); ctx.quadraticCurveTo(8, 70, 12, 96); ctx.stroke();
  ctx.strokeStyle = '#a8703c'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(30, 66); ctx.quadraticCurveTo(8, 70, 12, 96); ctx.stroke();
  // Arms up (hanging/grabbing).
  const armY = grabbing ? 70 : 20;
  for (const ax of [34, 66]) {
    ctx.strokeStyle = o; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(ax, 58); ctx.lineTo(ax + (ax < 50 ? -10 : 10), armY); ctx.stroke();
    ctx.strokeStyle = '#a8703c'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(ax, 58); ctx.lineTo(ax + (ax < 50 ? -10 : 10), armY); ctx.stroke();
  }
  ellipse(ctx, 50, 72, 22, 24); fillStroke(ctx, '#a8703c', o);
  ellipse(ctx, 50, 78, 13, 15); ctx.fillStyle = '#f1cfa3'; ctx.fill();
  circle(ctx, 50, 40, 20); fillStroke(ctx, '#a8703c', o);
  for (const ex of [29, 71]) { circle(ctx, ex, 40, 8); fillStroke(ctx, '#f1cfa3', o); }
  ellipse(ctx, 50, 46, 14, 11); ctx.fillStyle = '#f1cfa3'; ctx.fill();
  for (const ex of [43, 57]) { circle(ctx, ex, 36, 3.5); ctx.fillStyle = '#2b1a0c'; ctx.fill(); }
  ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(50, 47, 6, 0.2, Math.PI - 0.2); ctx.stroke();
  for (const fx of [40, 60]) { ellipse(ctx, fx, 96, 8, 5); fillStroke(ctx, '#a8703c', o, 2); }
}

function drawHand(ctx: Ctx): void {
  // A big cartoon glove pressing down: fingers point toward the floor.
  const o = '#7a4f8f';
  roundRect(ctx, 30, 0, 80, 70, 10); fillStroke(ctx, '#f6d8ff', o);
  ctx.fillStyle = '#e8bff7'; ctx.fillRect(34, 4, 72, 14);
  for (let i = 0; i < 4; i++) {
    roundRect(ctx, 28 + i * 22, 58, 20, 64, 10); fillStroke(ctx, '#ffffff', o);
  }
  ellipse(ctx, 120, 70, 12, 26, -0.4); fillStroke(ctx, '#ffffff', o);
  ctx.strokeStyle = o; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(32 + i * 22, 100); ctx.lineTo(44 + i * 22, 100); ctx.stroke(); }
}

function drawKing(ctx: Ctx): void {
  const o = '#4a2a6a';
  // Cape.
  ctx.beginPath(); ctx.moveTo(30, 70); ctx.quadraticCurveTo(20, 150, 40, 170); ctx.lineTo(120, 170); ctx.quadraticCurveTo(140, 150, 130, 70); ctx.closePath();
  fillStroke(ctx, '#7c3fc4', o);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(34, 160, 92, 10);
  for (let x = 40; x < 124; x += 12) { circle(ctx, x, 165, 2); ctx.fillStyle = '#2a1a3a'; ctx.fill(); }
  // Body.
  ellipse(ctx, 80, 118, 38, 44); fillStroke(ctx, '#ffd84d', '#b8932a');
  ctx.fillStyle = '#b8932a'; for (const by of [96, 114, 132]) { circle(ctx, 80, by, 3); ctx.fill(); }
  // Head.
  circle(ctx, 80, 58, 30); fillStroke(ctx, '#ffe3c7', o);
  // Crown.
  ctx.beginPath(); ctx.moveTo(56, 36); ctx.lineTo(58, 12); ctx.lineTo(68, 26); ctx.lineTo(80, 6); ctx.lineTo(92, 26); ctx.lineTo(102, 12); ctx.lineTo(104, 36); ctx.closePath();
  fillStroke(ctx, '#ffd84d', '#b8932a');
  for (const [cx, cy, col] of [[80, 22, '#ff4f8b'], [64, 30, '#4fb3ff'], [96, 30, '#4fd17a']] as const) { circle(ctx, cx, cy, 3.5); ctx.fillStyle = col; ctx.fill(); }
  // Face: smiling... a little too sly.
  for (const ex of [70, 90]) { circle(ctx, ex, 56, 3.8); ctx.fillStyle = '#2a1a3a'; ctx.fill(); }
  ctx.strokeStyle = '#2a1a3a'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(64, 47); ctx.lineTo(75, 50); ctx.moveTo(96, 47); ctx.lineTo(85, 50); ctx.stroke();
  ctx.fillStyle = '#7a4a2a';
  ellipse(ctx, 72, 70, 10, 4, 0.2); ctx.fill(); ellipse(ctx, 88, 70, 10, 4, -0.2); ctx.fill();
  ctx.beginPath(); ctx.arc(80, 74, 7, 0.25, Math.PI - 0.25); ctx.stroke();
  // Phone in hand.
  roundRect(ctx, 112, 92, 22, 36, 5); fillStroke(ctx, '#2a2a3a', '#111');
  roundRect(ctx, 115, 96, 16, 26, 3); ctx.fillStyle = '#7fe0ff'; ctx.fill();
  ellipse(ctx, 116, 116, 9, 8); fillStroke(ctx, '#ffe3c7', o, 2);
}

function drawMonster(ctx: Ctx, friendly: boolean): void {
  const w = friendly ? 120 : 320;
  const s = w / 320;
  ctx.save();
  ctx.scale(s, s);
  const o = '#3b1f5c';
  // Fuzzy body.
  ctx.fillStyle = '#8a5cf0';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 14) {
    circle(ctx, 160 + Math.cos(a) * 128, 190 + Math.sin(a) * 118, 22); ctx.fill();
  }
  ellipse(ctx, 160, 190, 132, 122); fillStroke(ctx, '#8a5cf0', o, 4);
  ellipse(ctx, 160, 222, 80, 66); ctx.fillStyle = '#b496ff'; ctx.fill();
  // Horns.
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(160 + dir * 70, 90); ctx.quadraticCurveTo(160 + dir * 120, 40, 160 + dir * 100, 10); ctx.quadraticCurveTo(160 + dir * 90, 60, 160 + dir * 40, 80); ctx.closePath();
    fillStroke(ctx, '#ffe6a8', '#b8932a', 3);
  }
  // Feet.
  for (const fx of [100, 220]) { ellipse(ctx, fx, 306, 42, 16); fillStroke(ctx, '#6d43d1', o, 4); }
  // Eyes.
  for (const ex of [118, 202]) {
    circle(ctx, ex, 150, 30); fillStroke(ctx, '#ffffff', o, 3);
    circle(ctx, ex + 6, 156, 13); ctx.fillStyle = '#2a1a3a'; ctx.fill();
    circle(ctx, ex + 10, 151, 4.5); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  ctx.strokeStyle = o; ctx.lineWidth = 8;
  if (friendly) {
    ctx.beginPath(); ctx.arc(160, 200, 34, 0.25, Math.PI - 0.25); ctx.stroke();
    for (const cx of [100, 220]) { circle(ctx, cx, 196, 14); ctx.fillStyle = '#ff9fd0'; ctx.globalAlpha = 0.7; ctx.fill(); ctx.globalAlpha = 1; }
  } else {
    ctx.beginPath(); ctx.moveTo(84, 108); ctx.lineTo(140, 124); ctx.moveTo(236, 108); ctx.lineTo(180, 124); ctx.stroke(); // grumpy brows
    ctx.beginPath(); ctx.arc(160, 236, 34, Math.PI + 0.35, -0.35); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(140, 214); ctx.lineTo(148, 228); ctx.lineTo(156, 213); ctx.fill();
    ctx.beginPath(); ctx.moveTo(164, 213); ctx.lineTo(172, 228); ctx.lineTo(180, 214); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- objects

function drawFlower(ctx: Ctx, petal: string, size: number): void {
  const c = size / 2;
  const r = size * 0.2;
  ctx.strokeStyle = '#3f9a52'; ctx.lineWidth = size * 0.07;
  ctx.beginPath(); ctx.moveTo(c, c + r); ctx.lineTo(c, size - 2); ctx.stroke();
  ellipse(ctx, c + size * 0.12, size * 0.82, size * 0.12, size * 0.06, -0.5); ctx.fillStyle = '#4fbf68'; ctx.fill();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ellipse(ctx, c + Math.cos(a) * r * 1.25, c * 0.82 + Math.sin(a) * r * 1.25, r * 0.95, r * 0.7, a);
    fillStroke(ctx, petal, 'rgba(120,60,140,0.55)', 1.5);
  }
  // Money center: a little gold coin.
  circle(ctx, c, c * 0.82, r * 0.95); fillStroke(ctx, '#ffd84d', '#c79a1e', 2);
  circle(ctx, c - r * 0.3, c * 0.82 - r * 0.3, r * 0.25); ctx.fillStyle = '#fff7c2'; ctx.fill();
}

function drawPortal(ctx: Ctx, size: number): void {
  const c = size / 2;
  const colors = ['#5b2bd1', '#3d6bff', '#8a4dff', '#3fa0ff', '#b06bff', '#6fd0ff'];
  colors.forEach((col, i) => {
    ellipse(ctx, c, c, c * (1 - i * 0.14), c * 1 * (1 - i * 0.14)); ctx.fillStyle = col; ctx.fill();
  });
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.arc(c, c, c * (0.3 + i * 0.2), i * 2, i * 2 + 2.2); ctx.stroke();
  }
  circle(ctx, c, c, c * 0.12); ctx.fillStyle = '#ffffff'; ctx.fill();
}

function drawCage(ctx: Ctx, open: boolean): void {
  const o = '#8a5a00';
  ellipse(ctx, 80, 18, 70, 14); fillStroke(ctx, '#ffd84d', o);
  roundRect(ctx, 6, 168, 148, 16, 6); fillStroke(ctx, '#ffd84d', o);
  ctx.strokeStyle = '#e0b020'; ctx.lineWidth = 6;
  const bars = open ? [14, 30, 46, 122, 138, 152] : [14, 30, 46, 62, 78, 94, 110, 126, 142];
  for (const x of bars) { ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, 170); ctx.stroke(); }
  if (!open) {
    roundRect(ctx, 66, 92, 28, 26, 5); fillStroke(ctx, '#ff5fae', '#a0306e', 2.5);
    ctx.strokeStyle = '#a0306e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(80, 92, 8, Math.PI, 0); ctx.stroke();
    circle(ctx, 80, 104, 3); ctx.fillStyle = '#5a1a3a'; ctx.fill();
  }
}

function drawGate(ctx: Ctx, main: string, dark: string, style: 'castle' | 'wood' | 'vault' | 'rainbow' | 'cloud'): void {
  const w = 120, h = 260;
  if (style === 'cloud') {
    ctx.fillStyle = '#ffffff';
    for (let y = 30; y < h; y += 34) for (const x of [30, 60, 90]) { circle(ctx, x + (y % 68 ? 6 : -6), y, 30); ctx.fill(); }
    ctx.strokeStyle = '#b9d8ff'; ctx.lineWidth = 3;
    for (let y = 30; y < h; y += 34) { ctx.beginPath(); ctx.arc(30, y, 30, Math.PI * 0.9, Math.PI * 1.4); ctx.stroke(); }
  } else if (style === 'rainbow') {
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    roundRect(ctx, 6, 6, w - 12, h - 12, 40); fillStroke(ctx, '#ffffff', '#6a3d92', 4);
    cols.forEach((c, i) => { roundRect(ctx, 16, 20 + i * 38, w - 32, 30, 12); ctx.fillStyle = c; ctx.fill(); });
  } else if (style === 'vault') {
    roundRect(ctx, 4, 4, w - 8, h - 8, 18); fillStroke(ctx, main, dark, 5);
    circle(ctx, w / 2, h / 2, 40); fillStroke(ctx, '#d9d9e6', dark, 5);
    ctx.strokeStyle = dark; ctx.lineWidth = 6;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(w / 2, h / 2); ctx.lineTo(w / 2 + Math.cos(a) * 34, h / 2 + Math.sin(a) * 34); ctx.stroke(); }
    for (const y of [26, h - 26]) for (const x of [22, w - 22]) { circle(ctx, x, y, 6); ctx.fillStyle = dark; ctx.fill(); }
  } else {
    roundRect(ctx, 4, 4, w - 8, h - 8, style === 'castle' ? 50 : 12); fillStroke(ctx, main, dark, 5);
    ctx.strokeStyle = dark; ctx.lineWidth = 7;
    if (style === 'castle') {
      for (const x of [30, 60, 90]) { ctx.beginPath(); ctx.moveTo(x, 30); ctx.lineTo(x, h - 8); ctx.stroke(); }
      for (const y of [80, 150, 220]) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke(); }
    } else {
      for (const y of [50, 110, 170, 230]) { ctx.beginPath(); ctx.moveTo(8, y); ctx.lineTo(w - 8, y); ctx.stroke(); }
    }
  }
  // Lock with a sparkle "?" — the spelling challenge.
  roundRect(ctx, w / 2 - 24, h / 2 - 6, 48, 42, 9); fillStroke(ctx, '#ffd84d', '#a87b10', 3);
  ctx.strokeStyle = '#a87b10'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(w / 2, h / 2 - 6, 14, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = '#7a4a00'; ctx.font = 'bold 26px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('?', w / 2, h / 2 + 16);
}

function drawBlock(ctx: Ctx, w: number, h: number, fill: string, top: string, dark: string, pattern: string): void {
  roundRect(ctx, 2, 2, w - 4, h - 4, 10); fillStroke(ctx, fill, dark, 3);
  roundRect(ctx, 5, 5, w - 10, Math.min(16, h / 3), 7); ctx.fillStyle = top; ctx.fill();
  ctx.strokeStyle = dark; ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
  if (pattern === 'brick') {
    for (let y = 22; y < h - 4; y += 16) { ctx.beginPath(); ctx.moveTo(6, y); ctx.lineTo(w - 6, y); ctx.stroke(); }
  } else if (pattern === 'dots') {
    for (let y = 26; y < h - 6; y += 16) for (let x = 12; x < w - 6; x += 16) { circle(ctx, x, y, 3); ctx.fillStyle = dark; ctx.fill(); }
  } else if (pattern === 'wood') {
    for (let x = 14; x < w - 6; x += 14) { ctx.beginPath(); ctx.moveTo(x, 22); ctx.lineTo(x, h - 6); ctx.stroke(); }
  } else {
    star(ctx, w / 2, h / 2 + 6, Math.min(w, h) * 0.2, Math.min(w, h) * 0.09); ctx.fillStyle = top; ctx.globalAlpha = 0.9; ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export interface BlockStyle { fill: string; top: string; dark: string; pattern: string }

/** A themed obstacle texture keyed by size and style. */
export function blockTexture(scene: Phaser.Scene, w: number, h: number, style: BlockStyle): string {
  const key = `block-${w}x${h}-${style.fill}-${style.pattern}`;
  makeTexture(scene, key, w, h, ctx => drawBlock(ctx, w, h, style.fill, style.top, style.dark, style.pattern));
  return key;
}

export function platformTexture(scene: Phaser.Scene, w: number, fill: string, top: string, dark: string): string {
  const key = `plat-${w}-${fill}`;
  makeTexture(scene, key, w, 30, ctx => {
    roundRect(ctx, 2, 4, w - 4, 24, 12); fillStroke(ctx, fill, dark, 3);
    roundRect(ctx, 6, 6, w - 12, 9, 5); ctx.fillStyle = top; ctx.fill();
  });
  return key;
}

export function gateTexture(scene: Phaser.Scene, main: string, dark: string, style: 'castle' | 'wood' | 'vault' | 'rainbow' | 'cloud'): string {
  const key = `gate-${style}-${main}`;
  makeTexture(scene, key, 120, 260, ctx => drawGate(ctx, main, dark, style));
  return key;
}

/** Characters and shared objects used by every scene. */
export function generateCoreArt(scene: Phaser.Scene): void {
  const poses: BunnyPose[] = ['run0', 'run1', 'run2', 'run3', 'jump', 'stand', 'cheer'];
  for (const pose of poses) {
    makeTexture(scene, `lyla-${pose}`, 120, 122, ctx => drawBunny(ctx, LYLA, pose));
  }
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

  makeTexture(scene, 'flower', 44, 52, ctx => drawFlower(ctx, '#ff7ac0', 44));
  makeTexture(scene, 'flower-b', 44, 52, ctx => drawFlower(ctx, '#9b7bff', 44));
  makeTexture(scene, 'flower-c', 44, 52, ctx => drawFlower(ctx, '#ffb347', 44));
  makeTexture(scene, 'flower-icon', 40, 40, ctx => { ctx.translate(0, -2); drawFlower(ctx, '#ff7ac0', 40); });
  makeTexture(scene, 'magic-flower', 150, 190, ctx => {
    ctx.save(); ctx.translate(0, 20); drawFlower(ctx, '#ff4fa8', 150); ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.9;
    for (const [x, y] of [[20, 30], [128, 40], [30, 120], [122, 118]]) { star(ctx, x, y, 9, 3.5, 4); ctx.fill(); }
    ctx.globalAlpha = 1;
  });
  makeTexture(scene, 'portal', 150, 150, ctx => drawPortal(ctx, 150));
  makeTexture(scene, 'cage', 160, 186, ctx => drawCage(ctx, false));
  makeTexture(scene, 'cage-open', 160, 186, ctx => drawCage(ctx, true));
  makeTexture(scene, 'sparkle', 24, 24, ctx => { star(ctx, 12, 12, 11, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fill(); });
  makeTexture(scene, 'sparkle-gold', 24, 24, ctx => { star(ctx, 12, 12, 11, 4, 4); ctx.fillStyle = '#ffe066'; ctx.fill(); });
  makeTexture(scene, 'dot', 12, 12, ctx => { circle(ctx, 6, 6, 5); ctx.fillStyle = '#ffffff'; ctx.fill(); });
  makeTexture(scene, 'speedline', 80, 8, ctx => { roundRect(ctx, 0, 1, 80, 6, 3); ctx.fillStyle = '#bfe0ff'; ctx.fill(); });
  for (const [name, col, dark] of [['bead-a', '#ff6fa8', '#c0407a'], ['bead-b', '#6fc8ff', '#2f88c0'], ['bead-c', '#ffd84d', '#c0a020']]) {
    makeTexture(scene, name, 30, 30, ctx => {
      circle(ctx, 15, 15, 12); fillStroke(ctx, col, dark, 2.5);
      circle(ctx, 15, 15, 4); ctx.fillStyle = dark; ctx.fill();
      circle(ctx, 10, 10, 3); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.8; ctx.fill(); ctx.globalAlpha = 1;
    });
  }
  makeTexture(scene, 'checkpoint', 60, 120, ctx => {
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(14, 118); ctx.lineTo(14, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, 14); ctx.lineTo(56, 26); ctx.lineTo(16, 42); ctx.closePath(); fillStroke(ctx, '#d9c6ef', '#8a6ab0', 2);
  });
  makeTexture(scene, 'checkpoint-on', 60, 120, ctx => {
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(14, 118); ctx.lineTo(14, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, 14); ctx.lineTo(56, 26); ctx.lineTo(16, 42); ctx.closePath(); fillStroke(ctx, '#ff6fb5', '#c0407a', 2);
    ctx.save(); ctx.translate(18, 10); ctx.scale(0.5, 0.5); drawFlower(ctx, '#ffd84d', 40); ctx.restore();
  });
  makeTexture(scene, 'bush', 170, 110, ctx => {
    ctx.fillStyle = '#3fa45a';
    for (const [x, y, r] of [[40, 70, 38], [85, 50, 46], [130, 70, 38], [85, 80, 40]]) { circle(ctx, x, y, r); ctx.fill(); }
    ctx.fillStyle = '#5cc274';
    for (const [x, y, r] of [[60, 52, 14], [100, 38, 16], [130, 60, 12]]) { circle(ctx, x, y, r); ctx.fill(); }
    ctx.fillStyle = '#ff7ac0';
    for (const [x, y] of [[44, 60], [92, 30], [140, 76], [74, 88]]) { circle(ctx, x, y, 5); ctx.fill(); }
  });
  makeTexture(scene, 'tree', 180, 330, ctx => {
    roundRect(ctx, 74, 120, 32, 210, 10); fillStroke(ctx, '#9a6a3c', '#5a3a1a');
    ctx.strokeStyle = '#7a4a1c'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(90, 160); ctx.quadraticCurveTo(130, 130, 150, 128); ctx.stroke();
    ctx.fillStyle = '#3c9a50';
    for (const [x, y, r] of [[90, 70, 70], [40, 100, 44], [140, 100, 44], [90, 120, 50]]) { circle(ctx, x, y, r); ctx.fill(); }
    ctx.fillStyle = '#58b96a';
    for (const [x, y, r] of [[70, 50, 22], [118, 70, 18], [50, 96, 14]]) { circle(ctx, x, y, r); ctx.fill(); }
  });
  makeTexture(scene, 'bow', 90, 110, ctx => {
    ctx.strokeStyle = '#b8742a'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(10, 55, 50, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(10, 55, 50, -1.1, 1.1); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(10 + Math.cos(-1.1) * 50, 55 + Math.sin(-1.1) * 50); ctx.lineTo(10 + Math.cos(1.1) * 50, 55 + Math.sin(1.1) * 50); ctx.stroke();
    star(ctx, 60, 55, 10, 4); ctx.fillStyle = '#ff6fb5'; ctx.fill();
  });
  makeTexture(scene, 'pedestal', 120, 90, ctx => {
    roundRect(ctx, 20, 10, 80, 20, 6); fillStroke(ctx, '#e9dcff', '#8a6ab0');
    roundRect(ctx, 34, 28, 52, 52, 4); fillStroke(ctx, '#d9c6ef', '#8a6ab0');
    roundRect(ctx, 14, 76, 92, 14, 6); fillStroke(ctx, '#e9dcff', '#8a6ab0');
  });
  makeTexture(scene, 'arrow', 70, 16, ctx => {
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(58, 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(56, 1); ctx.lineTo(70, 8); ctx.lineTo(56, 15); ctx.closePath(); ctx.fillStyle = '#c0c0d0'; ctx.fill();
    ctx.fillStyle = '#ff6fb5'; ctx.beginPath(); ctx.moveTo(2, 2); ctx.lineTo(14, 8); ctx.lineTo(2, 14); ctx.closePath(); ctx.fill();
  });
  makeTexture(scene, 'rainbow-arrow', 90, 22, ctx => {
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, 2 + i * 3, 70, 3); });
    ctx.beginPath(); ctx.moveTo(68, 0); ctx.lineTo(90, 11); ctx.lineTo(68, 22); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
  });
  makeTexture(scene, 'target', 100, 100, ctx => {
    ['#ffffff', '#ff6fb5', '#ffffff', '#ff6fb5', '#ffd84d'].forEach((c, i) => { circle(ctx, 50, 50, 46 - i * 9); fillStroke(ctx, c, '#8a3a6a', 2); });
  });
  makeTexture(scene, 'star-target', 90, 90, ctx => {
    star(ctx, 45, 47, 42, 19); fillStroke(ctx, '#ffe066', '#c79a1e', 4);
    star(ctx, 45, 47, 22, 10); ctx.fillStyle = '#fff7c2'; ctx.fill();
  });
  makeTexture(scene, 'heart-target', 120, 110, ctx => {
    const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
    cols.forEach((c, i) => {
      const s = 1 - i * 0.13;
      ctx.save(); ctx.translate(60, 56); ctx.scale(s, s);
      ctx.beginPath(); ctx.moveTo(0, 44); ctx.bezierCurveTo(-70, -6, -34, -56, 0, -20); ctx.bezierCurveTo(34, -56, 70, -6, 0, 44); ctx.closePath();
      ctx.fillStyle = c; ctx.fill(); ctx.restore();
    });
  });
  makeTexture(scene, 'phone-big', 150, 250, ctx => {
    roundRect(ctx, 4, 4, 142, 242, 22); fillStroke(ctx, '#2a2a3a', '#111', 4);
    roundRect(ctx, 16, 26, 118, 190, 8); ctx.fillStyle = '#7fe0ff'; ctx.fill();
    ctx.fillStyle = '#3a6aa0'; ctx.font = 'bold 18px Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ROBOT', 75, 80); ctx.fillText('BUNNY', 75, 102); ctx.fillText('CONTROL', 75, 124);
    for (const [x, y, c] of [[48, 160, '#ff6fb5'], [102, 160, '#ffd84d'], [48, 196, '#4fd17a'], [102, 196, '#9b6bff']] as const) { circle(ctx, x, y, 14); ctx.fillStyle = c; ctx.fill(); }
    circle(ctx, 75, 232, 8); ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();
  });
  const paints = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
  paints.forEach((c, i) => {
    makeTexture(scene, `paint-${i}`, 80, 84, ctx => {
      ellipse(ctx, 40, 18, 30, 9); fillStroke(ctx, c, '#5a3a6a', 2.5);
      ctx.beginPath(); ctx.moveTo(10, 18); ctx.lineTo(16, 76); ctx.quadraticCurveTo(40, 86, 64, 76); ctx.lineTo(70, 18); ctx.closePath();
      fillStroke(ctx, '#f2f2f8', '#5a3a6a', 2.5);
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(12, 30); ctx.lineTo(68, 30); ctx.lineTo(66, 48); ctx.lineTo(14, 48); ctx.closePath(); ctx.fill();
      circle(ctx, 30, 60, 4); ctx.fill(); circle(ctx, 50, 64, 3); ctx.fill();
    });
    makeTexture(scene, `splat-${i}`, 64, 64, ctx => {
      ctx.fillStyle = c;
      circle(ctx, 32, 32, 20); ctx.fill();
      for (let k = 0; k < 7; k++) { const a = (k / 7) * Math.PI * 2 + i; circle(ctx, 32 + Math.cos(a) * 22, 32 + Math.sin(a) * 22, 7 + (k % 3) * 2); ctx.fill(); }
    });
  });
  makeTexture(scene, 'paint-door', 150, 270, ctx => {
    roundRect(ctx, 4, 4, 142, 262, 60); fillStroke(ctx, '#ffffff', '#6a3d92', 5);
    for (let i = 0; i < 6; i++) { circle(ctx, 75, 46 + i * 38, 15); ctx.strokeStyle = '#c9b3e6'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]); }
  });
}
