/** Visual themes for the 22 locations. Backgrounds are generated lazily per level to save iPad memory. */
import Phaser from 'phaser';
import { makeTexture, type BlockStyle } from './art';

export type ThemeKey = 'castle' | 'rainbow' | 'sky' | 'garden' | 'night' | 'woodland' | 'zoo' | 'river' |
  'orchard' | 'town' | 'meadow' | 'control' | 'final';

export interface Theme {
  sky: [string, string];
  far: string;
  farAccent: string;
  mid: string;
  midAccent: string;
  ground: string;
  groundTop: string;
  groundDark: string;
  block: BlockStyle;
  platform: [string, string, string];
  gate: { main: string; dark: string; style: 'castle' | 'wood' | 'vault' | 'rainbow' | 'cloud' };
  hudText: string;
  painter: 'castle' | 'rainbow' | 'clouds' | 'hills' | 'night' | 'forest' | 'zoo' | 'river' | 'orchard' | 'town' | 'final';
}

export const THEMES: Record<ThemeKey, Theme> = {
  castle: {
    sky: ['#ffd1ec', '#ff9fd2'], far: '#ff7cc0', farAccent: '#ffc2e3', mid: '#f25aa9', midAccent: '#ffe066',
    ground: '#c9468f', groundTop: '#ff8fcb', groundDark: '#9a2f6c',
    block: { fill: '#ff9fd2', top: '#ffd1ec', dark: '#a8357a', pattern: 'brick' },
    platform: ['#ffb3dc', '#ffe0f2', '#a8357a'], gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'castle' },
    hudText: '#6a1f4c', painter: 'castle'
  },
  rainbow: {
    sky: ['#fff4fb', '#e6dcff'], far: '#ffffff', farAccent: '#ffffff', mid: '#cdb8ff', midAccent: '#ffffff',
    ground: '#9b7bff', groundTop: '#ffd84d', groundDark: '#6a4bd0',
    block: { fill: '#7fd6ff', top: '#d6f3ff', dark: '#3a88b8', pattern: 'star' },
    platform: ['#ff9fd2', '#ffe0f2', '#a8357a'], gate: { main: '#ffffff', dark: '#6a3d92', style: 'rainbow' },
    hudText: '#4a2a8a', painter: 'rainbow'
  },
  sky: {
    sky: ['#7cc8ff', '#d6f0ff'], far: '#ffffff', farAccent: '#eaf6ff', mid: '#ffffff', midAccent: '#ffe6f4',
    ground: '#ffffff', groundTop: '#ffffff', groundDark: '#a9c9ec',
    block: { fill: '#ffffff', top: '#eaf6ff', dark: '#8fb3dc', pattern: 'dots' },
    platform: ['#ffffff', '#eaf6ff', '#8fb3dc'], gate: { main: '#ffffff', dark: '#8fb3dc', style: 'cloud' },
    hudText: '#2a5a8a', painter: 'clouds'
  },
  garden: {
    sky: ['#a8e4ff', '#e8fbff'], far: '#9fe0a0', farAccent: '#ff9fd2', mid: '#5cc274', midAccent: '#ffe066',
    ground: '#6a4a2c', groundTop: '#58b96a', groundDark: '#3f2a18',
    block: { fill: '#c98a5a', top: '#e8b48a', dark: '#7a4a28', pattern: 'wood' },
    platform: ['#7ad08a', '#b6f0c0', '#2f7a44'], gate: { main: '#58b96a', dark: '#2f7a44', style: 'wood' },
    hudText: '#245a34', painter: 'hills'
  },
  night: {
    sky: ['#1d1c55', '#4b3a8a'], far: '#2c2a6e', farAccent: '#fff6c2', mid: '#36408a', midAccent: '#ffb3e6',
    ground: '#2a2a5a', groundTop: '#4fa86a', groundDark: '#181838',
    block: { fill: '#7b6bd6', top: '#a99bff', dark: '#3a2a8a', pattern: 'star' },
    platform: ['#8f7fff', '#c9c0ff', '#3a2a8a'], gate: { main: '#7b6bd6', dark: '#3a2a8a', style: 'wood' },
    hudText: '#ffffff', painter: 'night'
  },
  woodland: {
    sky: ['#c8ecd2', '#f2fff0'], far: '#8fcf9a', farAccent: '#6db07c', mid: '#3f8a52', midAccent: '#ffb347',
    ground: '#5a3e24', groundTop: '#4f9a5a', groundDark: '#36240f',
    block: { fill: '#a9744a', top: '#d09a6a', dark: '#5a3a1a', pattern: 'wood' },
    platform: ['#b98454', '#e2b585', '#5a3a1a'], gate: { main: '#a9744a', dark: '#5a3a1a', style: 'wood' },
    hudText: '#24502e', painter: 'forest'
  },
  zoo: {
    sky: ['#ffe9a8', '#fff8e0'], far: '#a8d870', farAccent: '#ff9f43', mid: '#6fb04a', midAccent: '#ffffff',
    ground: '#c98a4a', groundTop: '#e8c070', groundDark: '#8a5a2a',
    block: { fill: '#ffb347', top: '#ffd89a', dark: '#b06a1a', pattern: 'dots' },
    platform: ['#8fd06a', '#c8f0a8', '#3f7a2a'], gate: { main: '#ffb347', dark: '#b06a1a', style: 'wood' },
    hudText: '#6a3a0a', painter: 'zoo'
  },
  river: {
    sky: ['#9fe6ff', '#e6fbff'], far: '#7fd0a0', farAccent: '#4fb3ff', mid: '#4fb3ff', midAccent: '#ffffff',
    ground: '#8a8a9a', groundTop: '#b8c8d0', groundDark: '#5a5a6a',
    block: { fill: '#a8b0c0', top: '#d8e0ea', dark: '#5a6070', pattern: 'dots' },
    platform: ['#c0c8d6', '#eef2f8', '#5a6070'], gate: { main: '#7fb0d0', dark: '#3a6080', style: 'wood' },
    hudText: '#1f4a6a', painter: 'river'
  },
  orchard: {
    sky: ['#bfe8ff', '#fffbe6'], far: '#b6e08a', farAccent: '#ff6a5a', mid: '#5cb84a', midAccent: '#ff5a4a',
    ground: '#7a5a34', groundTop: '#7cc95a', groundDark: '#4a3418',
    block: { fill: '#e8a85a', top: '#ffd08a', dark: '#9a5a1a', pattern: 'wood' },
    platform: ['#9ad870', '#d0f4b0', '#3f7a2a'], gate: { main: '#e8a85a', dark: '#9a5a1a', style: 'wood' },
    hudText: '#3a4a10', painter: 'orchard'
  },
  town: {
    sky: ['#d9d4ff', '#fff0e6'], far: '#b4a8e6', farAccent: '#ffe066', mid: '#8f7fd0', midAccent: '#ffd84d',
    ground: '#6a5a8a', groundTop: '#a99bd6', groundDark: '#3f3060',
    block: { fill: '#b8a8e6', top: '#e0d8ff', dark: '#5a4a90', pattern: 'brick' },
    platform: ['#c9bdf0', '#ece6ff', '#5a4a90'], gate: { main: '#9aa0b8', dark: '#4a5068', style: 'vault' },
    hudText: '#2f2460', painter: 'town'
  },
  meadow: {
    sky: ['#9fdcff', '#f0fff6'], far: '#b0e89a', farAccent: '#ffffff', mid: '#6cc96a', midAccent: '#ff8fcb',
    ground: '#6a4a2c', groundTop: '#6cc96a', groundDark: '#3f2a18',
    block: { fill: '#f0c060', top: '#ffe2a0', dark: '#a07a20', pattern: 'star' },
    platform: ['#8fd88a', '#c8f6c0', '#2f7a44'], gate: { main: '#6cc96a', dark: '#2f7a44', style: 'wood' },
    hudText: '#245a34', painter: 'hills'
  },
  control: {
    sky: ['#ffd1ec', '#e6c8ff'], far: '#d38cff', farAccent: '#7fe0ff', mid: '#b05ad8', midAccent: '#7fe0ff',
    ground: '#8a3a9a', groundTop: '#ff8fcb', groundDark: '#5a1f6a',
    block: { fill: '#c08ae8', top: '#e8ccff', dark: '#6a2f8a', pattern: 'dots' },
    platform: ['#d8a8f8', '#f2e0ff', '#6a2f8a'], gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'castle' },
    hudText: '#4a1a5a', painter: 'castle'
  },
  final: {
    sky: ['#ffb38a', '#ffe0f0'], far: '#ff8fcb', farAccent: '#ffe066', mid: '#e85aa0', midAccent: '#9b6bff',
    ground: '#6a3a5a', groundTop: '#7cc95a', groundDark: '#3a1a30',
    block: { fill: '#ff9fd2', top: '#ffd1ec', dark: '#a8357a', pattern: 'star' },
    platform: ['#ffb3dc', '#ffe0f2', '#a8357a'], gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'rainbow' },
    hudText: '#5a1a3a', painter: 'final'
  }
};

type Ctx = CanvasRenderingContext2D;

function gradientSky(ctx: Ctx, w: number, h: number, top: string, bottom: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function blob(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx: Ctx, x: number, y: number, s: number): void {
  blob(ctx, x, y, 26 * s); blob(ctx, x + 28 * s, y - 12 * s, 32 * s); blob(ctx, x + 60 * s, y, 26 * s);
  ctx.fillRect(x, y - 4 * s, 60 * s, 30 * s);
}

/** Far layer: 960×540, tiles horizontally (left and right edges match). */
function paintFar(ctx: Ctx, t: Theme): void {
  const W = 960, H = 540;
  gradientSky(ctx, W, H, t.sky[0], t.sky[1]);
  ctx.fillStyle = t.far;
  switch (t.painter) {
    case 'castle': {
      // Inside the hot pink castle: arches, pillars, banners.
      ctx.fillStyle = t.far;
      for (let x = 0; x < W; x += 240) {
        ctx.fillRect(x, 120, 60, 420);
        ctx.fillStyle = t.farAccent; ctx.beginPath(); ctx.arc(x + 150, 260, 70, Math.PI, 0); ctx.fillRect(x + 80, 260, 140, 280); ctx.fill();
        ctx.fillStyle = t.far;
        ctx.fillStyle = t.midAccent; ctx.beginPath(); ctx.moveTo(x + 20, 140); ctx.lineTo(x + 40, 140); ctx.lineTo(x + 40, 220); ctx.lineTo(x + 30, 205); ctx.lineTo(x + 20, 220); ctx.closePath(); ctx.fill();
        ctx.fillStyle = t.far;
      }
      ctx.fillStyle = t.mid; ctx.globalAlpha = 0.35;
      for (let x = 0; x < W; x += 48) ctx.fillRect(x, 0, 24, 60);
      ctx.globalAlpha = 1;
      break;
    }
    case 'rainbow': {
      const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
      cols.forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = 0.33; ctx.fillRect(0, 40 + i * 70, W, 70); });
      ctx.globalAlpha = 0.7; ctx.fillStyle = '#ffffff';
      for (let x = 30; x < W; x += 160) cloud(ctx, x, 90 + ((x / 160) % 3) * 110, 0.8);
      ctx.globalAlpha = 1;
      break;
    }
    case 'clouds': {
      ctx.fillStyle = t.farAccent;
      for (let x = 0; x < W; x += 190) cloud(ctx, x + 20, 380 + ((x / 190) % 2) * 40, 1.5);
      ctx.fillStyle = '#ffffff';
      for (let x = 60; x < W; x += 240) cloud(ctx, x, 120 + ((x / 240) % 2) * 60, 1);
      break;
    }
    case 'hills': case 'final': {
      ctx.fillStyle = t.farAccent; ctx.globalAlpha = 0.8;
      if (t.painter === 'final') { blob(ctx, 760, 150, 70); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = t.far;
      ctx.beginPath(); ctx.moveTo(0, 400);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 380 - Math.sin((x / W) * Math.PI * 4) * 40);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.85;
      for (let x = 80; x < W; x += 300) cloud(ctx, x, 110 + ((x / 300) % 2) * 50, 0.9);
      ctx.globalAlpha = 1;
      break;
    }
    case 'night': {
      ctx.fillStyle = t.farAccent;
      blob(ctx, 760, 110, 46);
      ctx.fillStyle = t.sky[0]; blob(ctx, 780, 98, 40);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 70; i++) { const x = (i * 137) % W, y = (i * 61) % 330; ctx.globalAlpha = 0.4 + (i % 5) / 8; blob(ctx, x, y, 1 + (i % 3)); }
      ctx.globalAlpha = 1;
      ctx.fillStyle = t.far;
      ctx.beginPath(); ctx.moveTo(0, 420);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 400 - Math.sin((x / W) * Math.PI * 2) * 50);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      break;
    }
    case 'forest': case 'orchard': {
      ctx.fillStyle = t.far;
      for (let x = -40; x < W + 40; x += 80) {
        const h = 160 + ((x * 7) % 90);
        blob(ctx, x + 40, 520 - h, 60);
        ctx.fillRect(x + 34, 520 - h, 12, h);
      }
      if (t.painter === 'orchard') {
        ctx.fillStyle = t.farAccent;
        for (let x = -40; x < W + 40; x += 80) {
          const top = 520 - (160 + ((x * 7) % 90));
          blob(ctx, x + 22, top - 14, 6); blob(ctx, x + 56, top + 8, 6); blob(ctx, x + 38, top - 34, 5);
        }
      }
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.7;
      for (let x = 100; x < W; x += 320) cloud(ctx, x, 90, 0.8);
      ctx.globalAlpha = 1;
      break;
    }
    case 'zoo': {
      ctx.fillStyle = t.far;
      ctx.beginPath(); ctx.moveTo(0, 430);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 410 - Math.sin((x / W) * Math.PI * 2) * 30);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // Zoo fence and palm trees.
      ctx.fillStyle = '#c98a4a';
      for (let x = 0; x < W; x += 30) ctx.fillRect(x, 400, 8, 70);
      ctx.fillRect(0, 410, W, 6); ctx.fillRect(0, 440, W, 6);
      for (let x = 120; x < W; x += 320) {
        ctx.fillStyle = '#a8703c'; ctx.fillRect(x, 230, 14, 180);
        ctx.fillStyle = '#4f9a3a';
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + 7 + Math.cos(k * 1.3) * 40, 230 + Math.sin(k * 1.3) * 10, 46, 12, k * 1.3, 0, Math.PI * 2); ctx.fill(); }
      }
      break;
    }
    case 'river': {
      ctx.fillStyle = t.far;
      ctx.beginPath(); ctx.moveTo(0, 360);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 340 - Math.sin((x / W) * Math.PI * 2) * 30);
      ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = t.farAccent; ctx.fillRect(0, 400, W, 140);
      ctx.strokeStyle = '#ffffff'; ctx.globalAlpha = 0.6; ctx.lineWidth = 3;
      for (let y = 420; y < 530; y += 26) for (let x = (y % 52); x < W; x += 90) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 15, y - 6, x + 30, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'town': {
      ctx.fillStyle = t.far;
      for (let x = 0; x < W; x += 160) {
        const h = 200 + ((x / 160) % 3) * 60;
        ctx.fillRect(x + 20, 540 - h, 90, h);
        ctx.beginPath(); ctx.moveTo(x + 10, 540 - h); ctx.lineTo(x + 65, 540 - h - 60); ctx.lineTo(x + 120, 540 - h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = t.farAccent;
        for (let wy = 540 - h + 30; wy < 480; wy += 50) { ctx.fillRect(x + 40, wy, 16, 22); ctx.fillRect(x + 74, wy, 16, 22); }
        ctx.fillStyle = t.far;
      }
      // Clock face.
      ctx.fillStyle = '#ffffff'; blob(ctx, 385, 230, 28);
      ctx.strokeStyle = t.mid; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(385, 230); ctx.lineTo(385, 210); ctx.moveTo(385, 230); ctx.lineTo(400, 236); ctx.stroke();
      break;
    }
  }
}

/** Mid layer: 960×260 transparent strip drawn near the ground. */
function paintMid(ctx: Ctx, t: Theme): void {
  const W = 960, H = 260;
  ctx.fillStyle = t.mid;
  switch (t.painter) {
    case 'castle':
      for (let x = 0; x < W; x += 320) {
        ctx.fillRect(x + 40, 60, 40, 200);
        ctx.fillStyle = t.midAccent; ctx.beginPath(); ctx.arc(x + 60, 50, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.6; ctx.fillRect(x + 140, 100, 70, 90); ctx.globalAlpha = 1;
        ctx.fillStyle = t.mid;
      }
      break;
    case 'rainbow': case 'final': {
      const cols = ['#ff5a5a', '#ff9f43', '#ffd84d', '#4fd17a', '#4fb3ff', '#9b6bff'];
      cols.forEach((c, i) => {
        ctx.strokeStyle = c; ctx.lineWidth = 12; ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.arc(480, 300, 300 - i * 12, Math.PI, 0); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      break;
    }
    case 'clouds':
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x < W; x += 200) cloud(ctx, x + 30, 200, 1.2);
      break;
    case 'hills': case 'night': case 'zoo': case 'orchard':
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 10) ctx.lineTo(x, 170 - Math.sin((x / W) * Math.PI * 6) * 26);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      ctx.fillStyle = t.midAccent;
      for (let x = 20; x < W; x += 47) blob(ctx, x, 200 + ((x * 3) % 40), 4);
      break;
    case 'forest':
      for (let x = 0; x < W; x += 120) {
        ctx.fillRect(x + 50, 80, 18, 180);
        blob(ctx, x + 59, 80, 46); blob(ctx, x + 30, 110, 30); blob(ctx, x + 90, 110, 30);
      }
      ctx.fillStyle = t.midAccent;
      for (let x = 30; x < W; x += 120) blob(ctx, x, 240, 6);
      break;
    case 'river':
      ctx.fillStyle = '#8a9aaa';
      for (let x = 0; x < W; x += 140) { ctx.beginPath(); ctx.ellipse(x + 60, 240, 50, 18, 0, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'town':
      for (let x = 0; x < W; x += 240) {
        ctx.beginPath(); ctx.arc(x + 80, 200, 44, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = t.midAccent;
        for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; ctx.fillRect(x + 80 + Math.cos(a) * 46 - 7, 200 + Math.sin(a) * 46 - 7, 14, 14); }
        ctx.fillStyle = t.mid;
      }
      break;
  }
}

function paintGround(ctx: Ctx, t: Theme): void {
  const W = 128, H = 90;
  ctx.fillStyle = t.ground; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = t.groundDark; ctx.globalAlpha = 0.35;
  for (const [x, y, r] of [[20, 40, 6], [70, 60, 8], [110, 34, 5], [44, 76, 5], [96, 80, 4]]) blob(ctx, x, y, r);
  ctx.globalAlpha = 1;
  ctx.fillStyle = t.groundTop; ctx.fillRect(0, 0, W, 16);
  for (let x = 0; x < W; x += 16) blob(ctx, x + 8, 16, 8);
}

export function ensureThemeArt(scene: Phaser.Scene, key: ThemeKey): { far: string; mid: string; ground: string } {
  const t = THEMES[key];
  const far = `bg-far-${key}`, mid = `bg-mid-${key}`, ground = `ground-${key}`;
  // Free other themes' large backgrounds (older iPads have little GPU memory).
  for (const other of Object.keys(THEMES)) {
    if (other === key) continue;
    for (const k of [`bg-far-${other}`, `bg-mid-${other}`]) if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  makeTexture(scene, far, 960, 540, ctx => paintFar(ctx, t));
  makeTexture(scene, mid, 960, 260, ctx => paintMid(ctx, t));
  makeTexture(scene, ground, 128, 90, ctx => paintGround(ctx, t));
  return { far, mid, ground };
}
