/**
 * Art for the Christmas level (Level 12): elves, Christmas trees, candy canes,
 * bells, a snowman, the welcome arch, the giant present and snowflakes. Drawn
 * with Canvas 2D like the rest of the game: no outside images. Generated when
 * the Christmas theme loads and freed again when another theme takes over.
 */
import Phaser from 'phaser';
import {
  circle, drawGiftBox, ellipse, fillStroke, gloss, lin, makeTexture, noShadow, rad, roundRect, softShadow, star
} from './art';

type Ctx = CanvasRenderingContext2D;

const PREFIX = 'xmas-';
const OUTLINE = '#4a2638';

// ------------------------------------------------------------------ pieces

/** A candy-cane stripe along the current path: dark edge, white body, red bands. */
function caneStroke(ctx: Ctx, width: number, red = '#e8394d', edge = '#9a1428'): void {
  ctx.save();
  ctx.lineCap = 'butt';
  ctx.strokeStyle = edge; ctx.lineWidth = width + 3; ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = width; ctx.stroke();
  ctx.setLineDash([width * 0.7, width * 0.7]); ctx.strokeStyle = red; ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

/** Holly: two leaves and three berries. */
function holly(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.fillStyle = lin(ctx, 0, y - 6 * s, 0, y + 6 * s, [[0, '#5fd17a'], [1, '#1f7a3a']]);
  for (const dir of [-1, 1]) { ellipse(ctx, x + dir * 7 * s, y, 8 * s, 3.6 * s, dir * 0.35); ctx.fill(); }
  for (const [dx, dy] of [[-2.6, -1], [2.6, -1], [0, -4]]) {
    circle(ctx, x + dx * s, y + dy * s, 2.7 * s);
    ctx.fillStyle = rad(ctx, x + dx * s, y + dy * s, 2.7 * s, [[0, '#ff9aa6'], [0.5, '#e8394d'], [1, '#9a1428']], x + dx * s - s, y + dy * s - s);
    ctx.fill();
  }
}

/** A Christmas bell (dome, flared rim, clapper) with a bow on top, centred on x, top at y. */
function bell(ctx: Ctx, x: number, y: number, s: number, metal: [string, string, string], bow: string): void {
  const [hi, mid, dark] = metal;
  softShadow(ctx, 3, 1.5, 'rgba(60,30,10,0.35)');
  ctx.beginPath();
  ctx.moveTo(x - 4 * s, y + 4 * s);
  ctx.bezierCurveTo(x - 10 * s, y + 4 * s, x - 9 * s, y + 16 * s, x - 13 * s, y + 21 * s);
  ctx.quadraticCurveTo(x, y + 25 * s, x + 13 * s, y + 21 * s);
  ctx.bezierCurveTo(x + 9 * s, y + 16 * s, x + 10 * s, y + 4 * s, x + 4 * s, y + 4 * s);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, x - 13 * s, 0, x + 13 * s, 0, [[0, dark], [0.35, hi], [0.6, mid], [1, dark]]), dark, 1.6 * s);
  noShadow(ctx);
  ellipse(ctx, x, y + 21.5 * s, 13 * s, 3 * s); fillStroke(ctx, lin(ctx, 0, y + 19 * s, 0, y + 25 * s, [[0, mid], [1, dark]]), dark, 1.2 * s);
  circle(ctx, x, y + 25 * s, 3.2 * s); fillStroke(ctx, rad(ctx, x, y + 25 * s, 3.2 * s, [[0, hi], [1, dark]], x - s, y + 24 * s), dark, 1 * s);
  gloss(ctx, x - 5 * s, y + 11 * s, 2 * s, 5 * s, 0.85, 0.2);
  // Bow.
  ctx.fillStyle = bow;
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(x, y + 3 * s);
    ctx.bezierCurveTo(x + dir * 9 * s, y - 4 * s, x + dir * 10 * s, y + 6 * s, x, y + 3 * s); ctx.fill();
  }
  circle(ctx, x, y + 3 * s, 2.4 * s); ctx.fill();
}

const GOLD: [string, string, string] = ['#fff6c0', '#ffd84d', '#b8800e'];
const SILVER: [string, string, string] = ['#ffffff', '#d8dee8', '#7a8498'];
const RUBY: [string, string, string] = ['#ffb0b8', '#e8394d', '#8a1424'];

/** Fir tiers, ornaments, garland, lights and a star. Draws a tree of height h whose trunk base is at (cx, baseY). */
export function drawChristmasTree(ctx: Ctx, cx: number, baseY: number, h: number, w: number, detail = true): void {
  const trunkH = h * 0.1;
  ctx.fillStyle = lin(ctx, cx - w * 0.06, 0, cx + w * 0.06, 0, [[0, '#5a3418'], [0.5, '#9a6234'], [1, '#4a2810']]);
  ctx.fillRect(cx - w * 0.055, baseY - trunkH - 4, w * 0.11, trunkH + 4);
  const tiers = [[0.1, 0.36, 0.22], [0.24, 0.55, 0.32], [0.4, 0.74, 0.41], [0.56, 0.9, 0.5]];
  const leaf = lin(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, '#6fd07a'], [0.45, '#2f9a4a'], [1, '#17602e']]);
  const top = baseY - h;
  for (let i = tiers.length - 1; i >= 0; i--) {
    const [a, b, hw] = tiers[i];
    const ty = top + a * h, by = top + b * h, half = hw * w;
    softShadow(ctx, 6, 3, 'rgba(10,30,20,0.3)');
    ctx.beginPath();
    ctx.moveTo(cx, ty);
    ctx.quadraticCurveTo(cx + half * 0.45, ty + (by - ty) * 0.55, cx + half, by);
    const scallops = 5 + i;
    for (let k = scallops; k > 0; k--) {
      const x0 = cx - half + (2 * half * k) / scallops, x1 = cx - half + (2 * half * (k - 1)) / scallops;
      ctx.quadraticCurveTo((x0 + x1) / 2, by + h * 0.035, x1, by);
    }
    ctx.quadraticCurveTo(cx - half * 0.45, ty + (by - ty) * 0.55, cx, ty);
    ctx.closePath();
    ctx.fillStyle = leaf; ctx.fill();
    noShadow(ctx);
    // Snow resting on the tips of each tier.
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (let k = 0; k < scallops; k++) {
      const sx = cx - half + (2 * half * (k + 0.5)) / scallops;
      ellipse(ctx, sx, by + h * 0.012, half / scallops * 0.75, h * 0.012); ctx.fill();
    }
    if (detail) {
      // Gold bead garland swag.
      ctx.fillStyle = '#ffe066';
      for (let t = 0.05; t <= 0.95; t += 0.045) {
        const gx = cx - half * 0.8 + half * 1.6 * t;
        const gy = ty + (by - ty) * (0.55 + 0.25 * Math.sin(t * Math.PI));
        circle(ctx, gx, gy, Math.max(1.3, w * 0.008)); ctx.fill();
      }
    }
  }
  // Ornaments.
  const balls: Array<[number, number, string]> = [
    [-0.08, 0.27, '#e8394d'], [0.09, 0.33, '#ffd84d'], [-0.16, 0.45, '#5fb3ff'], [0.15, 0.5, '#e8394d'],
    [0.0, 0.47, '#d8dee8'], [-0.27, 0.64, '#ffd84d'], [0.24, 0.66, '#b48aff'], [-0.05, 0.62, '#e8394d'],
    [0.1, 0.72, '#5fb3ff'], [-0.34, 0.83, '#e8394d'], [0.33, 0.84, '#ffd84d'], [-0.13, 0.82, '#ff8fcb'], [0.14, 0.86, '#e8394d']
  ];
  const r = Math.max(2.5, w * 0.032);
  for (const [fx, fy, col] of balls) {
    const bx = cx + fx * w, by = top + fy * h;
    softShadow(ctx, 2, 1, 'rgba(20,10,30,0.35)');
    circle(ctx, bx, by, r); ctx.fillStyle = rad(ctx, bx, by, r, [[0, '#ffffff'], [0.3, col], [1, col]], bx - r * 0.4, by - r * 0.4); ctx.fill();
    noShadow(ctx);
    if (detail) { ctx.fillStyle = '#c9a43a'; ctx.fillRect(bx - r * 0.35, by - r * 1.2, r * 0.7, r * 0.4); }
  }
  // Twinkle lights.
  const lights = ['#fff3a0', '#ff9aa6', '#9fe0ff', '#b6f5a8'];
  for (let i = 0; i < (detail ? 22 : 12); i++) {
    const t = (i * 0.618) % 1, row = (i * 0.37) % 1;
    const ly = top + h * (0.18 + row * 0.7);
    const span = w * (0.1 + row * 0.38);
    const lx = cx - span + 2 * span * t;
    softShadow(ctx, 6, 0, lights[i % 4]);
    circle(ctx, lx, ly, Math.max(1.4, w * 0.012)); ctx.fillStyle = lights[i % 4]; ctx.fill();
  }
  noShadow(ctx);
  // Star on top.
  softShadow(ctx, 14, 0, 'rgba(255,230,120,0.95)');
  star(ctx, cx, top + h * 0.05, w * 0.1, w * 0.045);
  fillStroke(ctx, lin(ctx, 0, top - w * 0.05, 0, top + h * 0.05 + w * 0.1, [[0, '#fffbe0'], [0.5, '#ffd84d'], [1, '#e0a91c']]), '#b8800e', Math.max(1, w * 0.008));
  noShadow(ctx);
}

/** A little elf facing the viewer; feet at y≈116 in a 90×120 box. */
function drawElf(ctx: Ctx, outfit: string, outfitDark: string, hat: string, hatDark: string, pose: 'wave' | 'cheer'): void {
  const o = OUTLINE;
  const skin = (x: number, y: number, r: number): CanvasGradient =>
    rad(ctx, x, y, r, [[0, '#fff3e6'], [0.65, '#ffdcbc'], [1, '#e9b48f']], x - r * 0.35, y - r * 0.4);
  // Striped stockings.
  for (const lx of [37, 53]) {
    roundRect(ctx, lx - 4.5, 86, 9, 24, 4); fillStroke(ctx, '#ffffff', o, 1.8);
    ctx.save(); roundRect(ctx, lx - 4.5, 86, 9, 24, 4); ctx.clip();
    ctx.fillStyle = '#e8394d'; for (let y = 88; y < 112; y += 7) ctx.fillRect(lx - 6, y, 12, 3.5);
    ctx.restore();
  }
  // Curly-toed shoes with tiny bells.
  for (const dir of [-1, 1]) {
    const sx = 45 + dir * 8;
    ctx.beginPath();
    ctx.moveTo(sx - 6 * dir, 116); ctx.lineTo(sx + 8 * dir, 116);
    ctx.quadraticCurveTo(sx + 16 * dir, 116, sx + 18 * dir, 106);
    ctx.quadraticCurveTo(sx + 12 * dir, 112, sx + 6 * dir, 108);
    ctx.lineTo(sx - 6 * dir, 108); ctx.closePath();
    fillStroke(ctx, lin(ctx, 0, 106, 0, 116, [[0, outfit], [1, outfitDark]]), o, 1.8);
    circle(ctx, sx + 18 * dir, 105, 2.4); fillStroke(ctx, '#ffd84d', '#b8800e', 1);
  }
  // Arms behind the tunic edges.
  const arm = (x0: number, y0: number, x1: number, y1: number): void => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
    ctx.strokeStyle = o; ctx.lineWidth = 10.5; ctx.stroke();
    ctx.strokeStyle = outfit; ctx.lineWidth = 7.5; ctx.stroke();
    circle(ctx, x1, y1, 5); fillStroke(ctx, skin(x1, y1, 5), o, 1.6);
  };
  if (pose === 'cheer') { arm(33, 62, 17, 38); arm(57, 62, 73, 38); } else { arm(33, 62, 24, 84); arm(57, 62, 72, 40); }
  // Tunic with a zigzag hem.
  softShadow(ctx, 3, 2, 'rgba(30,10,30,0.3)');
  ctx.beginPath();
  ctx.moveTo(34, 58); ctx.lineTo(56, 58); ctx.lineTo(64, 88);
  for (let k = 0; k < 6; k++) {
    ctx.lineTo(64 - (k + 0.5) * (38 / 6), k % 2 ? 88 : 94);
    ctx.lineTo(64 - (k + 1) * (38 / 6), 88);
  }
  ctx.closePath();
  fillStroke(ctx, lin(ctx, 26, 0, 64, 0, [[0, outfitDark], [0.35, outfit], [0.7, outfit], [1, outfitDark]]), o, 1.8);
  noShadow(ctx);
  // Belt and buckle.
  ctx.fillStyle = '#3a2418'; ctx.fillRect(29.5, 76, 31, 5);
  roundRect(ctx, 41, 74.5, 8, 8, 1.5); ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2; ctx.stroke();
  // Zigzag collar with bells.
  ctx.beginPath(); ctx.moveTo(32, 57);
  for (let k = 0; k <= 4; k++) ctx.lineTo(32 + k * 6.5, k % 2 ? 57 : 65);
  ctx.lineTo(58, 57); ctx.closePath();
  fillStroke(ctx, hat, o, 1.4);
  for (const bx of [32, 45, 58]) { circle(ctx, bx, 65.5, 2); fillStroke(ctx, '#ffd84d', '#b8800e', 0.8); }
  // Pointy ears.
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(45 + dir * 13, 36); ctx.lineTo(45 + dir * 27, 28); ctx.lineTo(45 + dir * 14, 46); ctx.closePath();
    fillStroke(ctx, skin(45 + dir * 18, 36, 12), o, 1.6);
    ctx.beginPath(); ctx.moveTo(45 + dir * 15, 37); ctx.lineTo(45 + dir * 23, 32); ctx.lineTo(45 + dir * 15, 42); ctx.closePath();
    ctx.fillStyle = '#ffb3b8'; ctx.fill();
  }
  // Head.
  circle(ctx, 45, 40, 15.5); fillStroke(ctx, skin(41, 35, 18), o, 1.8);
  for (const ex of [39.5, 50.5]) {
    ellipse(ctx, ex, 41, 2.6, 3.2); ctx.fillStyle = '#2a1a2a'; ctx.fill();
    circle(ctx, ex + 0.9, 39.8, 1); ctx.fillStyle = '#ffffff'; ctx.fill();
  }
  for (const cx of [35, 55]) { circle(ctx, cx, 46, 3.4); ctx.fillStyle = 'rgba(255,110,130,0.4)'; ctx.fill(); }
  circle(ctx, 45, 45, 2); ctx.fillStyle = '#f2a08a'; ctx.fill();
  ctx.strokeStyle = '#6a2a3a'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(45, 47, 5, 0.25, Math.PI - 0.25); ctx.stroke();
  // Floppy hat with a fur brim and a bell on the tip.
  ctx.beginPath();
  ctx.moveTo(30, 30);
  ctx.quadraticCurveTo(34, 8, 52, 4);
  ctx.quadraticCurveTo(70, 2, 76, 14);
  ctx.quadraticCurveTo(64, 10, 58, 18);
  ctx.quadraticCurveTo(60, 24, 60, 30);
  ctx.closePath();
  fillStroke(ctx, lin(ctx, 30, 0, 76, 0, [[0, hat], [0.6, hat], [1, hatDark]]), o, 1.8);
  gloss(ctx, 40, 16, 4, 7, 0.4, 0.5);
  roundRect(ctx, 27, 26, 36, 9, 4.5); fillStroke(ctx, lin(ctx, 0, 26, 0, 35, [[0, '#ffffff'], [1, '#dfe4f2']]), o, 1.6);
  circle(ctx, 76, 16, 4); fillStroke(ctx, rad(ctx, 76, 16, 4, [[0, '#fff6c0'], [0.6, '#ffd84d'], [1, '#b8800e']], 75, 15), '#8a6008', 1.2);
}

/** A friendly snowman in a 120×160 box, base at y≈156. */
function drawSnowman(ctx: Ctx): void {
  const snow = (x: number, y: number, r: number): CanvasGradient =>
    rad(ctx, x, y, r, [[0, '#ffffff'], [0.7, '#f2f5ff'], [1, '#c4cdea']], x - r * 0.35, y - r * 0.4);
  // Stick arms.
  ctx.strokeStyle = '#6a4220'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(40, 88); ctx.lineTo(10, 66); ctx.moveTo(20, 73); ctx.lineTo(12, 60); ctx.moveTo(80, 88); ctx.lineTo(112, 70); ctx.moveTo(102, 75); ctx.lineTo(108, 62); ctx.stroke();
  softShadow(ctx, 6, 3, 'rgba(40,50,110,0.3)');
  circle(ctx, 60, 126, 32); fillStroke(ctx, snow(60, 126, 32), '#a8b2d8', 2);
  circle(ctx, 60, 84, 24); fillStroke(ctx, snow(60, 84, 24), '#a8b2d8', 2);
  circle(ctx, 60, 48, 19); fillStroke(ctx, snow(60, 48, 19), '#a8b2d8', 2);
  noShadow(ctx);
  for (const by of [78, 90, 104]) { circle(ctx, 60, by, 2.6); ctx.fillStyle = '#2a2a3a'; ctx.fill(); }
  for (const ex of [53, 66]) { circle(ctx, ex, 44, 2.6); ctx.fillStyle = '#2a2a3a'; ctx.fill(); }
  for (let k = 0; k < 5; k++) { const a = 0.45 + k * 0.56; circle(ctx, 60 + Math.cos(a) * 9, 51 + Math.sin(a) * 6, 1.4); ctx.fill(); }
  // Carrot nose.
  ctx.beginPath(); ctx.moveTo(60, 47); ctx.lineTo(80, 51); ctx.lineTo(60, 52); ctx.closePath();
  ctx.fillStyle = lin(ctx, 60, 0, 80, 0, [[0, '#ff9a3c'], [1, '#e0641a']]); ctx.fill();
  // Striped scarf.
  roundRect(ctx, 39, 62, 42, 9, 4.5); ctx.fillStyle = '#e8394d'; ctx.fill();
  roundRect(ctx, 66, 66, 10, 26, 4); ctx.fill();
  ctx.fillStyle = '#2fa65a'; for (const x of [46, 58, 70]) ctx.fillRect(x, 62, 4, 9);
  ctx.fillRect(66, 78, 10, 4);
  // Top hat with holly.
  ctx.fillStyle = lin(ctx, 44, 0, 76, 0, [[0, '#1a1a2a'], [0.4, '#3a3a52'], [1, '#14141e']]);
  roundRect(ctx, 40, 30, 40, 6, 3); ctx.fill();
  roundRect(ctx, 47, 6, 26, 26, 3); ctx.fill();
  ctx.fillStyle = '#e8394d'; ctx.fillRect(47, 24, 26, 5);
  holly(ctx, 70, 24, 0.7);
  ellipse(ctx, 60, 156, 40, 5); ctx.fillStyle = 'rgba(200,210,240,0.7)'; ctx.fill();
}

/** Welcome arch: candy-cane posts, a sign, an evergreen garland and three bells. 300×330, base at the bottom. */
function drawArch(ctx: Ctx): void {
  const W = 300, H = 330;
  // Candy-cane posts.
  for (const px of [30, W - 30]) {
    softShadow(ctx, 5, 2, 'rgba(40,10,30,0.3)');
    roundRect(ctx, px - 9, 30, 18, H - 30, 7); fillStroke(ctx, '#ffffff', '#9a1428', 2.5);
    noShadow(ctx);
    ctx.save(); roundRect(ctx, px - 9, 30, 18, H - 30, 7); ctx.clip();
    ctx.fillStyle = '#e8394d';
    for (let y = 20; y < H; y += 22) { ctx.beginPath(); ctx.moveTo(px - 10, y); ctx.lineTo(px + 10, y - 12); ctx.lineTo(px + 10, y - 3); ctx.lineTo(px - 10, y + 9); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = lin(ctx, px - 9, 0, px + 9, 0, [[0, 'rgba(255,255,255,0.4)'], [0.5, 'rgba(255,255,255,0)'], [1, 'rgba(80,0,20,0.18)']]); ctx.fillRect(px - 9, 30, 18, H);
    ctx.restore();
    circle(ctx, px, 26, 10); fillStroke(ctx, rad(ctx, px, 26, 10, [[0, '#fff6c0'], [0.6, '#ffd84d'], [1, '#b8800e']], px - 3, 23), '#8a6008', 1.6);
  }
  // Sign.
  softShadow(ctx, 6, 3, 'rgba(40,10,30,0.35)');
  roundRect(ctx, 40, 34, W - 80, 42, 12); fillStroke(ctx, lin(ctx, 0, 34, 0, 76, [[0, '#ff5a6c'], [1, '#b81c34']]), '#7a1020', 2.5);
  noShadow(ctx);
  roundRect(ctx, 45, 39, W - 90, 32, 9); ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px "Avenir Next", "Trebuchet MS", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#7a1020'; ctx.lineWidth = 4; ctx.strokeText('Merry Christmas!', W / 2, 56); ctx.fillText('Merry Christmas!', W / 2, 56);
  // Garland swag with lights.
  const pt = (t: number): [number, number] => {
    const x = (1 - t) ** 2 * 30 + 2 * (1 - t) * t * (W / 2) + t * t * (W - 30);
    const y = (1 - t) ** 2 * 84 + 2 * (1 - t) * t * 150 + t * t * 84;
    return [x, y];
  };
  softShadow(ctx, 4, 2, 'rgba(10,40,20,0.3)');
  for (let t = 0; t <= 1.0001; t += 0.02) {
    const [x, y] = pt(t);
    circle(ctx, x, y, 9); ctx.fillStyle = rad(ctx, x, y, 9, [[0, '#5fcf6a'], [0.7, '#2a8a42'], [1, '#17602e']], x - 3, y - 3); ctx.fill();
  }
  noShadow(ctx);
  const lightCols = ['#fff3a0', '#ff9aa6', '#9fe0ff', '#b6f5a8'];
  for (let i = 1; i < 12; i++) {
    const [x, y] = pt(i / 12);
    softShadow(ctx, 6, 0, lightCols[i % 4]); circle(ctx, x, y + 4, 3); ctx.fillStyle = lightCols[i % 4]; ctx.fill();
  }
  noShadow(ctx);
  // Bells hanging from the garland.
  for (const t of [0.25, 0.5, 0.75]) {
    const [x, y] = pt(t);
    ctx.strokeStyle = '#b81c34'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 14); ctx.stroke();
    bell(ctx, x, y + 10, 1.05, GOLD, '#e8394d');
  }
  // Red bows where the garland meets the posts.
  for (const px of [30, W - 30]) {
    ctx.fillStyle = '#e8394d'; ctx.strokeStyle = '#8a1424'; ctx.lineWidth = 1.5;
    for (const dir of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(px, 86); ctx.bezierCurveTo(px + dir * 18, 72, px + dir * 20, 96, px, 86); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px, 86); ctx.lineTo(px + dir * 9, 108); ctx.lineTo(px + dir * 3, 106); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    circle(ctx, px, 86, 4.5); ctx.fill(); ctx.stroke();
  }
}

/** Front of the elves' giant present (170×130): open top, ribbon and a gift tag ("?" until it is opened, then a heart). */
function drawGiantBox(ctx: Ctx, opened: boolean): void {
  const W = 170, H = 130;
  // Dark inside, only seen once the lid is off.
  ctx.beginPath(); ctx.moveTo(10, 14); ctx.lineTo(24, 2); ctx.lineTo(W - 10, 2); ctx.lineTo(W - 10, 14); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, 2, 0, 14, [[0, '#4a0c18'], [1, '#7a1424']]); ctx.fill();
  softShadow(ctx, 8, 4, 'rgba(40,10,30,0.35)');
  roundRect(ctx, 8, 12, W - 16, H - 14, 6);
  fillStroke(ctx, lin(ctx, 0, 0, W, 0, [[0, '#9a1428'], [0.25, '#e8394d'], [0.6, '#ff7484'], [1, '#9a1428']]), '#7a1020', 3);
  noShadow(ctx);
  ctx.save(); roundRect(ctx, 8, 12, W - 16, H - 14, 6); ctx.clip();
  ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffff';
  for (let y = 26, row = 0; y < H; y += 20, row++) for (let x = 22 + (row % 2) * 12; x < W - 10; x += 24) { star(ctx, x, y, 5, 2); ctx.fill(); }
  ctx.restore();
  ctx.fillStyle = lin(ctx, W / 2 - 13, 0, W / 2 + 13, 0, [[0, '#c99418'], [0.45, '#fff1a0'], [1, '#c99418']]);
  ctx.fillRect(W / 2 - 13, 12, 26, H - 14);
  // Gift tag with a "?": the spelling challenge, like the word locks on gates.
  ctx.strokeStyle = '#c99418'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 + 10, 16); ctx.quadraticCurveTo(W / 2 + 30, 34, W / 2 + 40, 44); ctx.stroke();
  ctx.save(); ctx.translate(W / 2 + 48, 62); ctx.rotate(-0.2);
  softShadow(ctx, 4, 2, 'rgba(40,10,30,0.35)');
  ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(14, -18); ctx.lineTo(14, 22); ctx.lineTo(-14, 22); ctx.lineTo(-14, -10); ctx.closePath();
  fillStroke(ctx, lin(ctx, 0, -18, 0, 22, [[0, '#ffffff'], [1, '#f2ecff']]), '#8a6ab0', 2);
  noShadow(ctx);
  circle(ctx, -8, -12, 2.5); ctx.fillStyle = '#c9b3e6'; ctx.fill();
  if (opened) {
    ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-16, 2, -8, -10, 0, -1); ctx.bezierCurveTo(8, -10, 16, 2, 0, 14); ctx.closePath();
    ctx.fillStyle = '#e8394d'; ctx.fill();
  } else {
    ctx.fillStyle = '#7445c5'; ctx.font = 'bold 26px "Avenir Next", Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('?', 0, 4);
  }
  ctx.restore();
  gloss(ctx, 34, 40, 10, 4, 0.5, 0);
}

/** The giant present's lid with a big golden bow (190×80, sits on the box). */
function drawGiantLid(ctx: Ctx): void {
  const W = 190;
  softShadow(ctx, 5, 3, 'rgba(40,10,30,0.35)');
  roundRect(ctx, 4, 46, W - 8, 30, 7);
  fillStroke(ctx, lin(ctx, 0, 46, 0, 76, [[0, '#ff7484'], [0.5, '#e8394d'], [1, '#9a1428']]), '#7a1020', 3);
  noShadow(ctx);
  ctx.fillStyle = lin(ctx, W / 2 - 13, 0, W / 2 + 13, 0, [[0, '#c99418'], [0.45, '#fff1a0'], [1, '#c99418']]);
  ctx.fillRect(W / 2 - 13, 46, 26, 30);
  roundRect(ctx, 10, 50, W - 20, 5, 2.5); ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
  const bx = W / 2, by = 46;
  const gold = lin(ctx, 0, 0, 0, 50, [[0, '#fff6c0'], [0.5, '#ffd84d'], [1, '#c99418']]);
  ctx.strokeStyle = '#a87b10'; ctx.lineWidth = 2.5;
  softShadow(ctx, 4, 2, 'rgba(90,60,0,0.3)');
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(bx, by);
    ctx.bezierCurveTo(bx + dir * 60, by - 52, bx + dir * 72, by + 8, bx, by);
    ctx.fillStyle = gold; ctx.fill(); ctx.stroke();
  }
  noShadow(ctx);
  for (const dir of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(bx + dir * 8, by - 10); ctx.bezierCurveTo(bx + dir * 34, by - 34, bx + dir * 44, by - 6, bx + dir * 10, by - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  }
  circle(ctx, bx, by - 2, 11); fillStroke(ctx, rad(ctx, bx, by - 2, 11, [[0, '#fffbe0'], [0.5, '#ffd84d'], [1, '#c99418']], bx - 3, by - 5), '#a87b10', 2.5);
  holly(ctx, bx + 2, by - 14, 0.9);
}

// ------------------------------------------------------------------ textures

export const ELF_KEYS = [
  { stand: `${PREFIX}elf`, cheer: `${PREFIX}elf-cheer` },
  { stand: `${PREFIX}elf-b`, cheer: `${PREFIX}elf-b-cheer` }
] as const;

export function ensureChristmasArt(scene: Phaser.Scene): void {
  // Trees get room above for the star and its glow; sprites are anchored at the base.
  makeTexture(scene, `${PREFIX}tree`, 220, 346, ctx => {
    ctx.translate(0, 16);
    drawChristmasTree(ctx, 110, 322, 316, 210);
    // Presents under the tree.
    ctx.save(); ctx.translate(30, 282); drawGiftBox(ctx, 52, 46, 0); ctx.restore();
    ctx.save(); ctx.translate(134, 290); drawGiftBox(ctx, 46, 38, 2); ctx.restore();
    ctx.save(); ctx.translate(84, 300); drawGiftBox(ctx, 40, 28, 1); ctx.restore();
  });
  makeTexture(scene, `${PREFIX}tree-small`, 120, 194, ctx => { ctx.translate(0, 14); drawChristmasTree(ctx, 60, 178, 176, 116, false); });
  makeTexture(scene, `${PREFIX}candycane`, 60, 130, ctx => {
    ellipse(ctx, 38, 126, 20, 5); ctx.fillStyle = 'rgba(220,228,250,0.95)'; ctx.fill();
    softShadow(ctx, 4, 2, 'rgba(40,10,30,0.3)');
    ctx.beginPath(); ctx.moveTo(38, 126); ctx.lineTo(38, 34); ctx.arc(24, 34, 14, 0, Math.PI, true); ctx.lineTo(10, 46);
    caneStroke(ctx, 12);
    noShadow(ctx);
    ctx.beginPath(); ctx.moveTo(35, 120); ctx.lineTo(35, 36); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.stroke();
    holly(ctx, 38, 56, 1.1);
  });
  ELF_KEYS.forEach(({ stand, cheer }, i) => {
    const [outfit, outfitDark, hat, hatDark] = i === 0
      ? ['#2fa65a', '#17663a', '#e8394d', '#9a1428']
      : ['#e8394d', '#9a1428', '#2fa65a', '#17663a'];
    makeTexture(scene, stand, 90, 120, ctx => drawElf(ctx, outfit, outfitDark, hat, hatDark, 'wave'));
    makeTexture(scene, cheer, 90, 120, ctx => drawElf(ctx, outfit, outfitDark, hat, hatDark, 'cheer'));
  });
  makeTexture(scene, `${PREFIX}snowman`, 120, 160, drawSnowman);
  makeTexture(scene, `${PREFIX}arch`, 300, 330, drawArch);
  makeTexture(scene, `${PREFIX}gift-box`, 170, 130, ctx => drawGiantBox(ctx, false));
  makeTexture(scene, `${PREFIX}gift-box-open`, 170, 130, ctx => drawGiantBox(ctx, true));
  makeTexture(scene, `${PREFIX}gift-lid`, 190, 80, drawGiantLid);
  for (const [key, metal, bow] of [['bell-a', GOLD, '#e8394d'], ['bell-b', SILVER, '#2fa65a'], ['bell-c', RUBY, '#2fa65a']] as const) {
    makeTexture(scene, `${PREFIX}${key}`, 32, 34, ctx => bell(ctx, 16, 3, 1.1, metal, bow));
  }
  makeTexture(scene, `${PREFIX}snowflake`, 18, 18, ctx => {
    circle(ctx, 9, 9, 8); ctx.fillStyle = rad(ctx, 9, 9, 8, [[0, 'rgba(255,255,255,0.55)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath(); ctx.moveTo(9, 9); ctx.lineTo(9 + c * 7, 9 + s * 7);
      const bx = 9 + c * 4.5, by = 9 + s * 4.5;
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a + 0.7) * 2.4, by + Math.sin(a + 0.7) * 2.4);
      ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.7) * 2.4, by + Math.sin(a - 0.7) * 2.4);
      ctx.stroke();
    }
  });
}

/** Free the Christmas textures when another theme loads (older iPads have little GPU memory). */
export function freeChristmasArt(scene: Phaser.Scene): void {
  for (const key of scene.textures.getTextureKeys()) if (key.startsWith(PREFIX)) scene.textures.remove(key);
}
