/** Painted backdrops for the title screen and adventure map (original Canvas 2D art). */
import Phaser from 'phaser';
import { lin, makeTexture, noShadow, rad, roundRect, softShadow } from './art';

type Ctx = CanvasRenderingContext2D;

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(r, 0.5), 0, Math.PI * 2);
}

function cloudShape(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.beginPath();
  for (const [dx, dy, r] of [[0, 0, 26], [28, -14, 34], [62, -4, 28], [88, 6, 22], [-22, 8, 20], [40, 10, 30]]) {
    ctx.moveTo(x + dx * s + r * s, y + dy * s);
    ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
  }
  ctx.fillStyle = lin(ctx, 0, y - 48 * s, 0, y + 40 * s, [[0, '#ffffff'], [0.55, '#ffffff'], [1, '#e2dcf2']]);
  ctx.fill();
}

function flowerDot(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8); ctx.fillStyle = color; ctx.fill(); }
  circle(ctx, x, y, r * 0.6); ctx.fillStyle = '#ffe066'; ctx.fill();
}

/** The hot pink castle on a hill, used on the title screen. */
function castle(ctx: Ctx, x: number, baseY: number): void {
  const wall = (x0: number, w: number): CanvasGradient => lin(ctx, x0, 0, x0 + w, 0, [[0, '#e8559f'], [0.35, '#ff9fd2'], [0.7, '#ffb8de'], [1, '#d4408c']]);
  softShadow(ctx, 14, 6, 'rgba(120,20,80,0.3)');
  // Keep.
  ctx.fillStyle = wall(x + 50, 170); ctx.fillRect(x + 50, baseY - 210, 170, 210);
  // Towers.
  for (const tx of [x, x + 190]) { ctx.fillStyle = wall(tx, 80); ctx.fillRect(tx, baseY - 290, 80, 290); }
  noShadow(ctx);
  // Crenellations.
  ctx.fillStyle = '#ff9fd2';
  for (let cx = x + 54; cx < x + 216; cx += 26) { ctx.fillRect(cx, baseY - 226, 16, 18); }
  // Conical roofs with pennants.
  for (const tx of [x, x + 190]) {
    ctx.beginPath(); ctx.moveTo(tx - 12, baseY - 288); ctx.lineTo(tx + 40, baseY - 380); ctx.lineTo(tx + 92, baseY - 288); ctx.closePath();
    ctx.fillStyle = lin(ctx, tx - 12, 0, tx + 92, 0, [[0, '#a8357a'], [0.45, '#f25aa9'], [0.6, '#ff8cc6'], [1, '#9a2f6c']]); ctx.fill();
    ctx.strokeStyle = '#6a1f4c'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx + 40, baseY - 380); ctx.lineTo(tx + 40, baseY - 412); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 40, baseY - 412); ctx.quadraticCurveTo(tx + 58, baseY - 408, tx + 72, baseY - 400); ctx.lineTo(tx + 40, baseY - 394); ctx.closePath();
    ctx.fillStyle = lin(ctx, tx + 40, 0, tx + 72, 0, [[0, '#ffe066'], [1, '#ffb347']]); ctx.fill();
    // Tower windows glowing.
    for (const wy of [baseY - 250, baseY - 170]) {
      softShadow(ctx, 10, 0, 'rgba(255,240,150,0.95)');
      ctx.beginPath(); ctx.moveTo(tx + 28, wy + 30); ctx.lineTo(tx + 28, wy + 12); ctx.arc(tx + 40, wy + 12, 12, Math.PI, 0); ctx.lineTo(tx + 52, wy + 30); ctx.closePath();
      ctx.fillStyle = lin(ctx, 0, wy, 0, wy + 30, [[0, '#fff8c8'], [1, '#ffd84d']]); ctx.fill();
      noShadow(ctx);
    }
  }
  // Brick hints.
  ctx.strokeStyle = 'rgba(160,30,100,0.18)'; ctx.lineWidth = 2;
  for (let by = baseY - 190; by < baseY; by += 22) { ctx.beginPath(); ctx.moveTo(x + 54, by); ctx.lineTo(x + 216, by); ctx.stroke(); }
  // Big round window with a heart.
  circle(ctx, x + 135, baseY - 150, 26);
  ctx.fillStyle = rad(ctx, x + 135, baseY - 150, 26, [[0, '#ffffff'], [1, '#ffd0ea']]); ctx.fill();
  ctx.strokeStyle = '#a8357a'; ctx.lineWidth = 4; ctx.stroke();
  ctx.save(); ctx.translate(x + 135, baseY - 150); ctx.scale(0.55, 0.55);
  ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-30, -2, -14, -24, 0, -8); ctx.bezierCurveTo(14, -24, 30, -2, 0, 18); ctx.closePath();
  ctx.fillStyle = '#ff4fa0'; ctx.fill(); ctx.restore();
  // Gate.
  ctx.beginPath(); ctx.moveTo(x + 105, baseY); ctx.lineTo(x + 105, baseY - 70); ctx.arc(x + 135, baseY - 70, 30, Math.PI, 0); ctx.lineTo(x + 165, baseY); ctx.closePath();
  ctx.fillStyle = lin(ctx, x + 105, 0, x + 165, 0, [[0, '#6a2a14'], [0.5, '#9a5228'], [1, '#5a2010']]); ctx.fill();
  ctx.strokeStyle = '#ffd84d'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
  for (const gx of [x + 120, x + 135, x + 150]) { ctx.beginPath(); ctx.moveTo(gx, baseY); ctx.lineTo(gx, baseY - 92); ctx.stroke(); }
  // Rim light on the left of each tower.
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x + 4, baseY - 286, 5, 282); ctx.fillRect(x + 194, baseY - 286, 5, 282);
}

export function generateTitleArt(scene: Phaser.Scene): void {
  makeTexture(scene, 'title-bg', 960, 540, ctx => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [[0, '#7fc8ff'], [0.5, '#c4e8ff'], [1, '#ffe2f2']]); ctx.fillRect(0, 0, 960, 540);
    circle(ctx, 880, 70, 180); ctx.fillStyle = rad(ctx, 880, 70, 180, [[0, 'rgba(255,250,210,0.75)'], [1, 'rgba(255,250,210,0)']]); ctx.fill();
    // Rainbow with a soft glow.
    const cols = ['#ff6a6a', '#ffab52', '#ffe066', '#5fdc8a', '#5fbfff', '#a37bff'];
    ctx.save();
    softShadow(ctx, 24, 0, 'rgba(255,255,255,0.9)');
    cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = 0.85; ctx.lineWidth = 17; ctx.beginPath(); ctx.arc(520, 560, 440 - i * 17, Math.PI, 0); ctx.stroke(); });
    ctx.restore();
    // Hills.
    ctx.beginPath(); ctx.moveTo(0, 540);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 420 - Math.sin(x / 150) * 22);
    ctx.lineTo(960, 540); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, 380, 0, 540, [[0, '#a8e0a0'], [1, '#6cbf6a']]); ctx.fill();
    castle(ctx, 30, 470);
    ctx.beginPath(); ctx.moveTo(0, 540);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 470 - Math.sin(x / 110 + 1) * 10);
    ctx.lineTo(960, 540); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, 450, 0, 540, [[0, '#8fd87a'], [1, '#4fa85a']]); ctx.fill();
    // Path from the castle gate.
    ctx.beginPath(); ctx.moveTo(140, 470); ctx.quadraticCurveTo(200, 510, 160, 540); ctx.lineTo(230, 540); ctx.quadraticCurveTo(250, 500, 190, 470); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 470, 0, 540, [[0, '#f6e2c0'], [1, '#e0c090']]); ctx.fill();
    // Grass blades and flowers along the front.
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 2;
    for (let x = 4; x < 960; x += 9) { ctx.beginPath(); ctx.moveTo(x, 540); ctx.quadraticCurveTo(x + 2, 528, x + (x % 2 ? 4 : -2), 518 + (x % 3) * 4); ctx.stroke(); }
    const flowerCols = ['#ff7ac0', '#ffffff', '#b48aff', '#ffb347'];
    for (let i = 0; i < 26; i++) flowerDot(ctx, 310 + ((i * 97) % 640), 488 + ((i * 37) % 44), 3.2, flowerCols[i % 4]);
  });
  makeTexture(scene, 'title-cloud', 160, 90, ctx => cloudShape(ctx, 34, 56, 1));
}

/** Node positions on the adventure map (8 / 7 / 7 snake). */
export function mapNodePositions(): Array<[number, number]> {
  const positions: Array<[number, number]> = [];
  for (let i = 0; i < 22; i++) {
    if (i < 8) positions.push([90 + i * 111, 158]);
    else if (i < 15) positions.push([835 - (i - 8) * 120, 270]);
    else positions.push([115 + (i - 15) * 120, 382]);
  }
  return positions;
}

export function generateMapArt(scene: Phaser.Scene): void {
  makeTexture(scene, 'map-bg', 960, 540, ctx => {
    ctx.fillStyle = lin(ctx, 0, 0, 0, 540, [[0, '#ffeaf7'], [0.5, '#f1ecff'], [1, '#dff1ff']]); ctx.fillRect(0, 0, 960, 540);
    // Soft clouds and hills.
    ctx.save(); ctx.globalAlpha = 0.75;
    for (const [x, y, s] of [[300, 70, 0.6], [560, 40, 0.5], [880, 110, 0.55]]) cloudShape(ctx, x, y, s);
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(0, 540);
    for (let x = 0; x <= 960; x += 8) ctx.lineTo(x, 470 - Math.sin(x / 120) * 16);
    ctx.lineTo(960, 540); ctx.closePath(); ctx.fillStyle = lin(ctx, 0, 440, 0, 540, [[0, '#c8ecc0'], [1, '#a6dca0']]); ctx.fill();
    // Little landmarks by their levels.
    const mark = (x: number, y: number, kind: string): void => {
      ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 0.9;
      if (kind === 'castle') {
        ctx.fillStyle = lin(ctx, -22, 0, 22, 0, [[0, '#e8559f'], [1, '#ffb8de']]); ctx.fillRect(-18, -26, 36, 26); ctx.fillRect(-26, -40, 12, 40); ctx.fillRect(14, -40, 12, 40);
        ctx.fillStyle = '#a8357a'; for (const tx of [-20, 20]) { ctx.beginPath(); ctx.moveTo(tx - 9, -40); ctx.lineTo(tx, -56); ctx.lineTo(tx + 9, -40); ctx.closePath(); ctx.fill(); }
      } else if (kind === 'rainbow') {
        ['#ff6a6a', '#ffe066', '#5fdc8a', '#5fbfff', '#a37bff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 30 - i * 4, Math.PI, 0); ctx.stroke(); });
      } else if (kind === 'palm') {
        ctx.strokeStyle = '#a8703c'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -20, 0, -40); ctx.stroke();
        ctx.fillStyle = '#5aae4a'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * 1.25) * 12, -40 + Math.sin(k * 1.25) * 4, 16, 5, k * 1.25, 0, Math.PI * 2); ctx.fill(); }
      } else if (kind === 'tower') {
        ctx.fillStyle = '#9a8ad8'; ctx.fillRect(-10, -50, 20, 50); ctx.beginPath(); ctx.moveTo(-14, -50); ctx.lineTo(0, -68); ctx.lineTo(14, -50); ctx.closePath(); ctx.fillStyle = '#6a5aa8'; ctx.fill();
        circle(ctx, 0, -38, 6); ctx.fillStyle = '#fff6dc'; ctx.fill();
      } else if (kind === 'flowers') {
        for (const [dx, h, c] of [[-14, 30, '#ff7ab8'], [4, 42, '#c78bff'], [18, 26, '#ff9a6a']] as const) {
          ctx.strokeStyle = '#4f9a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(dx, 0); ctx.lineTo(dx, -h); ctx.stroke();
          flowerDot(ctx, dx, -h, 6, c);
        }
      } else if (kind === 'tree') {
        ctx.fillStyle = '#7a5230'; ctx.fillRect(-3, -20, 6, 20); circle(ctx, 0, -28, 16); ctx.fillStyle = rad(ctx, 0, -28, 16, [[0, '#8fe08a'], [1, '#3f9a52']], -5, -34); ctx.fill();
      }
      ctx.restore();
    };
    mark(200, 120, 'rainbow'); mark(36, 470, 'castle'); mark(920, 228, 'palm'); mark(760, 232, 'palm');
    mark(400, 232, 'tree'); mark(60, 344, 'tower'); mark(178, 342, 'tower'); mark(916, 344, 'flowers'); mark(620, 344, 'tree');
    // The winding road connecting the levels.
    const pts = mapNodePositions();
    const road = (width: number, color: string | CanvasGradient, dash?: number[]): void => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        if (i === 0) { ctx.moveTo(x, y); return; }
        const [px, py] = pts[i - 1];
        if (py !== y) {
          // U-turn between rows.
          const side = x > 480 ? 1 : -1;
          ctx.bezierCurveTo(px + side * 70, py, x + side * 70, y, x, y);
        } else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.setLineDash(dash ?? []); ctx.stroke(); ctx.setLineDash([]);
    };
    softShadow(ctx, 8, 3, 'rgba(90,40,120,0.25)');
    road(26, '#e6d2b4');
    noShadow(ctx);
    road(20, '#fff4de');
    road(3, '#e2c49a', [10, 12]);
  });

  const node = (key: string, top: string, mid: string, bottom: string, rim: string, glow?: string): void => {
    makeTexture(scene, key, 84, 84, ctx => {
      if (glow) { circle(ctx, 42, 42, 41); ctx.fillStyle = rad(ctx, 42, 42, 41, [[0.6, glow], [1, 'rgba(255,255,255,0)']]); ctx.fill(); }
      softShadow(ctx, 6, 3, 'rgba(60,20,90,0.35)');
      circle(ctx, 42, 42, 30); ctx.fillStyle = lin(ctx, 0, 12, 0, 72, [[0, top], [0.5, mid], [1, bottom]]); ctx.fill();
      noShadow(ctx);
      ctx.strokeStyle = rim; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.ellipse(42, 28, 20, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = lin(ctx, 0, 19, 0, 37, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]); ctx.fill(); ctx.restore();
    });
  };
  node('node-locked', '#ffffff', '#f6f0ff', '#e2d6f4', '#a88cd0');
  node('node-done', '#ffc2e3', '#ff7ac0', '#d8408c', '#ffffff');
  node('node-current', '#c4a6ff', '#8a5cf0', '#5a2fc0', '#ffffff', 'rgba(255,220,120,0.65)');
}

/** Storybook frame behind cutscene panels. */
export function generateStoryFrame(scene: Phaser.Scene): void {
  makeTexture(scene, 'panel-frame', 900, 380, ctx => {
    softShadow(ctx, 16, 6, 'rgba(10,4,30,0.5)');
    roundRect(ctx, 10, 10, 880, 360, 26); ctx.fillStyle = '#fff6ff'; ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = lin(ctx, 0, 10, 0, 370, [[0, '#ffd1ec'], [1, '#e7b6ff']]); ctx.lineWidth = 8; ctx.stroke();
  });
}
