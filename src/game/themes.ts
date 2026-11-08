/**
 * Visual themes for the story locations: painted parallax backgrounds, themed
 * ground, obstacles, platforms, foreground strip and ambient particles.
 * Backgrounds are generated lazily per level and other themes' large
 * textures are freed, to stay within older iPads' GPU memory.
 */
import Phaser from 'phaser';
import { EXTRA_HEIGHT, RES } from './hidpi';
import {
  freeThemeProps, lin, makeTexture, noShadow, rad, roundRect, softShadow,
  type PlatformStyle, type PropColors, type PropStyle
} from './art';
import { drawChristmasTree, ensureChristmasArt, freeChristmasArt } from './christmasArt';

export type ThemeKey = 'castle' | 'rainbow' | 'sky' | 'garden' | 'night' | 'woodland' | 'zoo' | 'river' |
  'orchard' | 'town' | 'meadow' | 'control' | 'final' | 'christmas';

type Painter = 'castle' | 'control' | 'rainbow' | 'clouds' | 'hills' | 'meadow' | 'night' | 'forest' | 'zoo' |
  'river' | 'orchard' | 'town' | 'final' | 'christmas';
type GroundStyle = 'grass' | 'tiles' | 'candy' | 'cloud' | 'sand' | 'stone' | 'cobble' | 'icing';
type Foreground = 'grass' | 'candy' | 'cloud' | 'flowers' | 'pebbles' | 'glow' | 'snow';
export type Ambient = 'petal' | 'sparkle' | 'pollen' | 'firefly' | 'leaf' | 'mote' | 'blossom' | 'snow';

export interface Theme {
  /** Top, middle and horizon sky colours. */
  sky: [string, string, string];
  painter: Painter;
  ground: { style: GroundStyle; top: string; topLight: string; soil: string; soilDark: string; accent: string };
  prop: { style: PropStyle; colors: PropColors };
  platform: { style: PlatformStyle; colors: PropColors };
  gate: { main: string; dark: string; style: 'castle' | 'wood' | 'vault' | 'rainbow' | 'cloud' };
  foreground: Foreground;
  ambient: Ambient;
  /** Tint for ambient particles. */
  ambientTint: number;
  hudText: string;
}

const PINK_STONE: PropColors = { main: '#ff9fd2', light: '#ffd9ee', dark: '#a8357a', accent: '#ffe066' };
const WOOD: PropColors = { main: '#c48a52', light: '#e8b47e', dark: '#6e4320', accent: '#ff7ac0' };

export const THEMES: Record<ThemeKey, Theme> = {
  castle: {
    sky: ['#ffd9ef', '#ffc2e3', '#ffb0d8'], painter: 'castle',
    ground: { style: 'tiles', top: '#ff9fd2', topLight: '#ffe3f2', soil: '#d4569d', soilDark: '#952a68', accent: '#ffe066' },
    prop: { style: 'stone', colors: PINK_STONE },
    platform: { style: 'stone', colors: PINK_STONE },
    gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'castle' },
    foreground: 'pebbles', ambient: 'petal', ambientTint: 0xffffff, hudText: '#6a1f4c'
  },
  rainbow: {
    sky: ['#fff1fa', '#f1e6ff', '#dcefff'], painter: 'rainbow',
    ground: { style: 'candy', top: '#ffffff', topLight: '#ffffff', soil: '#a88bff', soilDark: '#6a4bd0', accent: '#ff7ac0' },
    prop: { style: 'candy', colors: { main: '#7fd0ff', light: '#e6f7ff', dark: '#3a88b8', accent: '#ff7ac0' } },
    platform: { style: 'candy', colors: { main: '#ff8fcb', light: '#ffe6f4', dark: '#b8407e', accent: '#ffe066' } },
    gate: { main: '#ffffff', dark: '#6a3d92', style: 'rainbow' },
    foreground: 'candy', ambient: 'sparkle', ambientTint: 0xffffff, hudText: '#4a2a8a'
  },
  sky: {
    sky: ['#4fa8ff', '#8fd0ff', '#dff3ff'], painter: 'clouds',
    ground: { style: 'cloud', top: '#ffffff', topLight: '#ffffff', soil: '#e8f2ff', soilDark: '#b8cff0', accent: '#ffd1ec' },
    prop: { style: 'cloud', colors: { main: '#ffffff', light: '#ffffff', dark: '#c8daf4', accent: '#ffd1ec' } },
    platform: { style: 'cloud', colors: { main: '#ffffff', light: '#ffffff', dark: '#b8cff0', accent: '#ffd1ec' } },
    gate: { main: '#ffffff', dark: '#8fb3dc', style: 'cloud' },
    foreground: 'cloud', ambient: 'sparkle', ambientTint: 0xfff6c8, hudText: '#1f4a7a'
  },
  garden: {
    sky: ['#7fcbff', '#bfe9ff', '#effff2'], painter: 'hills',
    ground: { style: 'grass', top: '#5cbf5c', topLight: '#a8e88a', soil: '#8a5a34', soilDark: '#5a3418', accent: '#ff7ac0' },
    prop: { style: 'pot', colors: { main: '#d9824e', light: '#f2b07e', dark: '#8a4420', accent: '#ff5fa8' } },
    platform: { style: 'leaf', colors: { main: '#58b05c', light: '#9be08a', dark: '#2f7a3a', accent: '#ff7ac0' } },
    gate: { main: '#58b96a', dark: '#2f7a44', style: 'wood' },
    foreground: 'flowers', ambient: 'pollen', ambientTint: 0xfff4a0, hudText: '#245a34'
  },
  night: {
    sky: ['#0f0d38', '#29236e', '#5a4aa8'], painter: 'night',
    ground: { style: 'grass', top: '#3f8a6a', topLight: '#6cc49a', soil: '#2a2350', soilDark: '#161230', accent: '#ffb3e6' },
    prop: { style: 'crystal', colors: { main: '#9b8bff', light: '#e6e0ff', dark: '#4a3aa8', accent: 'rgba(170,150,255,0.9)' } },
    platform: { style: 'crystal', colors: { main: '#8f7fff', light: '#d8d0ff', dark: '#3a2a8a', accent: 'rgba(170,150,255,0.9)' } },
    gate: { main: '#7b6bd6', dark: '#3a2a8a', style: 'wood' },
    foreground: 'glow', ambient: 'firefly', ambientTint: 0xffffff, hudText: '#ffffff'
  },
  woodland: {
    sky: ['#a8e0c0', '#d8f4dc', '#fff6d8'], painter: 'forest',
    ground: { style: 'grass', top: '#4f9a4a', topLight: '#8fd06a', soil: '#6a4626', soilDark: '#3e2810', accent: '#ffb347' },
    prop: { style: 'stump', colors: WOOD },
    platform: { style: 'wood', colors: WOOD },
    gate: { main: '#a9744a', dark: '#5a3a1a', style: 'wood' },
    foreground: 'grass', ambient: 'leaf', ambientTint: 0xffffff, hudText: '#24502e'
  },
  zoo: {
    sky: ['#ffcf7a', '#ffe7b0', '#fff6e2'], painter: 'zoo',
    ground: { style: 'sand', top: '#e8c070', topLight: '#fbe2a8', soil: '#c98a4a', soilDark: '#8a5a2a', accent: '#6fb04a' },
    prop: { style: 'crate', colors: { main: '#d9a05e', light: '#f2c890', dark: '#7a4a1a', accent: '#ffb347' } },
    platform: { style: 'wood', colors: WOOD },
    gate: { main: '#ffb347', dark: '#b06a1a', style: 'wood' },
    foreground: 'grass', ambient: 'mote', ambientTint: 0xffe8b0, hudText: '#6a3a0a'
  },
  river: {
    sky: ['#7fd4ff', '#c0ecff', '#eefbff'], painter: 'river',
    ground: { style: 'stone', top: '#8fbf6a', topLight: '#c0e69a', soil: '#9aa3b2', soilDark: '#5a6070', accent: '#6fc8ff' },
    prop: { style: 'rock', colors: { main: '#a8b0c0', light: '#e2e8f0', dark: '#5a6070', accent: '#8fd06a' } },
    platform: { style: 'stone', colors: { main: '#b8c2d0', light: '#eef2f8', dark: '#5a6070', accent: '#8fd06a' } },
    gate: { main: '#7fb0d0', dark: '#3a6080', style: 'wood' },
    foreground: 'pebbles', ambient: 'sparkle', ambientTint: 0xd6f4ff, hudText: '#1f4a6a'
  },
  orchard: {
    sky: ['#9fd6ff', '#d6efff', '#fff4d8'], painter: 'orchard',
    ground: { style: 'grass', top: '#6cbf4a', topLight: '#b0e67a', soil: '#8a6234', soilDark: '#55381a', accent: '#ff5a4a' },
    prop: { style: 'crate', colors: { main: '#e0a85a', light: '#ffd08a', dark: '#8a5418', accent: '#ff5a4a' } },
    platform: { style: 'wood', colors: WOOD },
    gate: { main: '#e8a85a', dark: '#9a5a1a', style: 'wood' },
    foreground: 'flowers', ambient: 'blossom', ambientTint: 0xffffff, hudText: '#3a4a10'
  },
  town: {
    sky: ['#b8a8ff', '#f2c8ef', '#ffe4c4'], painter: 'town',
    ground: { style: 'cobble', top: '#b8aade', topLight: '#e6dcff', soil: '#7a6a9e', soilDark: '#463a6a', accent: '#ffd84d' },
    prop: { style: 'crate', colors: { main: '#b8a2e6', light: '#e2d6ff', dark: '#54428e', accent: '#ffd84d' } },
    platform: { style: 'stone', colors: { main: '#c9bdf0', light: '#efe9ff', dark: '#5a4a90', accent: '#ffd84d' } },
    gate: { main: '#9aa0b8', dark: '#4a5068', style: 'vault' },
    foreground: 'pebbles', ambient: 'mote', ambientTint: 0xffe6a0, hudText: '#2f2460'
  },
  meadow: {
    sky: ['#86d0ff', '#c8eeff', '#f4fff0'], painter: 'meadow',
    ground: { style: 'grass', top: '#66c460', topLight: '#b4ec8e', soil: '#8a5a34', soilDark: '#5a3418', accent: '#ff8fcb' },
    prop: { style: 'pot', colors: { main: '#f0c060', light: '#ffe2a0', dark: '#a07a20', accent: '#ff5fa8' } },
    platform: { style: 'leaf', colors: { main: '#66c460', light: '#b4ec8e', dark: '#2f7a44', accent: '#ffd84d' } },
    gate: { main: '#6cc96a', dark: '#2f7a44', style: 'wood' },
    foreground: 'flowers', ambient: 'pollen', ambientTint: 0xffffff, hudText: '#245a34'
  },
  control: {
    sky: ['#e9d2ff', '#f6d6ff', '#ffd1ec'], painter: 'control',
    ground: { style: 'tiles', top: '#c99af0', topLight: '#f0e0ff', soil: '#8a4ab0', soilDark: '#56206e', accent: '#7fe0ff' },
    prop: { style: 'stone', colors: { main: '#c99af0', light: '#f0e0ff', dark: '#6a2f8a', accent: '#7fe0ff' } },
    platform: { style: 'stone', colors: { main: '#d8a8f8', light: '#f6ecff', dark: '#6a2f8a', accent: '#7fe0ff' } },
    gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'castle' },
    foreground: 'glow', ambient: 'sparkle', ambientTint: 0x9feaff, hudText: '#4a1a5a'
  },
  final: {
    sky: ['#ff8f86', '#ffb8d0', '#ffe6c0'], painter: 'final',
    ground: { style: 'grass', top: '#6cbf4a', topLight: '#b0e67a', soil: '#7a3a5a', soilDark: '#4a1a34', accent: '#ff7ac0' },
    prop: { style: 'candy', colors: { main: '#ff8fcb', light: '#ffe6f4', dark: '#a8357a', accent: '#ffe066' } },
    platform: { style: 'candy', colors: { main: '#b48aff', light: '#efe6ff', dark: '#6a3db8', accent: '#ffe066' } },
    gate: { main: '#ff7cc0', dark: '#9a2f6c', style: 'rainbow' },
    foreground: 'flowers', ambient: 'petal', ambientTint: 0xffffff, hudText: '#5a1a3a'
  },
  christmas: {
    sky: ['#1f2a66', '#5560b4', '#f2b9d9'], painter: 'christmas',
    ground: { style: 'icing', top: '#ffffff', topLight: '#ffffff', soil: '#c47e40', soilDark: '#7a4520', accent: '#e8394d' },
    prop: { style: 'gift', colors: { main: '#e8394d', light: '#ff8a96', dark: '#9a1428', accent: '#ffd84d' } },
    platform: { style: 'candycane', colors: { main: '#e8394d', light: '#ffffff', dark: '#9a1428', accent: '#e8394d' } },
    gate: { main: '#e8394d', dark: '#9a1428', style: 'wood' },
    foreground: 'snow', ambient: 'snow', ambientTint: 0xffffff, hudText: '#ffffff'
  }
};

type Ctx = CanvasRenderingContext2D;
const W = 960;

/** Seeded random so backgrounds are identical every time. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw at x and again across the seam, so the layer tiles horizontally. */
function wrap(x: number, reach: number, draw: (x: number) => void): void {
  draw(x);
  if (x - reach < 0) draw(x + W);
  if (x + reach > W) draw(x - W);
}

function circle(ctx: Ctx, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(r, 0.5), 0, Math.PI * 2);
}

function skyGradient(ctx: Ctx, h: number, t: Theme): void {
  ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, t.sky[0]], [0.55, t.sky[1]], [1, t.sky[2]]]);
  ctx.fillRect(0, 0, W, h);
}

function sun(ctx: Ctx, x: number, y: number, r: number, core: string, glow: string): void {
  circle(ctx, x, y, r * 4);
  ctx.fillStyle = rad(ctx, x, y, r * 4, [[0, glow], [1, 'rgba(255,255,255,0)']]); ctx.fill();
  circle(ctx, x, y, r);
  ctx.fillStyle = rad(ctx, x, y, r, [[0, '#ffffff'], [0.6, core], [1, core]], x - r * 0.3, y - r * 0.3); ctx.fill();
}

/** A soft shaded cloud: white tops, lavender undersides. */
function cloud(ctx: Ctx, x: number, y: number, s: number, alpha = 1, under = '#e2dcf2'): void {
  wrap(x, 110 * s, cx => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    for (const [dx, dy, r] of [[0, 0, 26], [28, -14, 34], [62, -4, 28], [88, 6, 22], [-22, 8, 20], [40, 10, 30]]) {
      ctx.moveTo(cx + dx * s + r * s, y + dy * s);
      ctx.arc(cx + dx * s, y + dy * s, r * s, 0, Math.PI * 2);
    }
    ctx.fillStyle = lin(ctx, 0, y - 48 * s, 0, y + 40 * s, [[0, '#ffffff'], [0.55, '#ffffff'], [1, under]]);
    ctx.fill();
    ctx.restore();
  });
}

function sparkles(ctx: Ctx, rand: () => number, n: number, yMax: number, color = '#ffffff'): void {
  for (let i = 0; i < n; i++) {
    const x = rand() * W, y = rand() * yMax, s = 2 + rand() * 4;
    ctx.save();
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    circle(ctx, x, y, s * 2.5); ctx.fillStyle = rad(ctx, x, y, s * 2.5, [[0, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y - s * 2); ctx.lineTo(x + s * 0.5, y - s * 0.5); ctx.lineTo(x + s * 2, y); ctx.lineTo(x + s * 0.5, y + s * 0.5);
    ctx.lineTo(x, y + s * 2); ctx.lineTo(x - s * 0.5, y + s * 0.5); ctx.lineTo(x - s * 2, y); ctx.lineTo(x - s * 0.5, y - s * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

/** Rolling hills band from yBase with amplitude, filled with a vertical gradient. */
function hills(ctx: Ctx, yBase: number, amp: number, waves: number, phase: number, h: number, top: string, bottom: string): void {
  ctx.beginPath(); ctx.moveTo(0, h);
  for (let x = 0; x <= W; x += 8) ctx.lineTo(x, yBase - Math.sin((x / W) * Math.PI * 2 * waves + phase) * amp - Math.sin((x / W) * Math.PI * 2 * waves * 2 + phase * 2) * amp * 0.25);
  ctx.lineTo(W, h); ctx.closePath();
  ctx.fillStyle = lin(ctx, 0, yBase - amp, 0, h, [[0, top], [1, bottom]]); ctx.fill();
}

function roundTree(ctx: Ctx, x: number, baseY: number, h: number, r: number, leaf: string, leafDark: string, trunk: string, fruit?: string, rand?: () => number): void {
  wrap(x, r + 4, cx => {
    ctx.fillStyle = trunk; ctx.fillRect(cx - r * 0.12, baseY - h, r * 0.24, h);
    circle(ctx, cx, baseY - h, r);
    ctx.fillStyle = rad(ctx, cx, baseY - h, r, [[0, leaf], [1, leafDark]], cx - r * 0.35, baseY - h - r * 0.4); ctx.fill();
    if (fruit && rand) {
      ctx.fillStyle = fruit;
      for (let k = 0; k < 6; k++) { const a = rand() * Math.PI * 2, d = rand() * r * 0.75; circle(ctx, cx + Math.cos(a) * d, baseY - h + Math.sin(a) * d, Math.max(2, r * 0.1)); ctx.fill(); }
    }
  });
}

function pine(ctx: Ctx, x: number, baseY: number, h: number, w: number, top: string, bottom: string): void {
  wrap(x, w, cx => {
    ctx.fillStyle = lin(ctx, 0, baseY - h, 0, baseY, [[0, top], [1, bottom]]);
    for (let k = 0; k < 3; k++) {
      const ty = baseY - h + k * h * 0.22, bw = w * (0.55 + k * 0.25);
      ctx.beginPath(); ctx.moveTo(cx, ty); ctx.lineTo(cx + bw / 2, ty + h * 0.45); ctx.lineTo(cx - bw / 2, ty + h * 0.45); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(cx - w * 0.06, baseY - h * 0.2, w * 0.12, h * 0.2);
  });
}

function lightRays(ctx: Ctx, fromX: number, n: number, color: string, h: number): void {
  for (let i = 0; i < n; i++) {
    const x = fromX + i * 150;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 50, 0); ctx.lineTo(x + 230, h); ctx.lineTo(x + 120, h); ctx.closePath();
    ctx.fillStyle = lin(ctx, 0, 0, 0, h, [[0, color], [1, 'rgba(255,255,255,0)']]); ctx.fill();
    ctx.restore();
  }
}

// ------------------------------------------------------------ far layers

/**
 * The far backdrop is painted for a 960×540 screen. On taller screens it is
 * drawn `extra` px lower in a taller texture, and the sky (plus stars at night
 * and the castle wall indoors) continues up into the space above.
 */
function paintFar(ctx: Ctx, t: Theme, extra: number): void {
  const H = 540;
  const top = -extra;
  const rand = rng(t.painter.length * 977 + 11);
  if (extra > 0) {
    ctx.fillStyle = t.sky[0]; ctx.fillRect(0, top, W, extra + 1);
    if (t.painter === 'night' || t.painter === 'christmas') {
      const bandRand = rng(extra * 31 + 7);
      for (let i = 0; i < extra * 0.4; i++) {
        const r = bandRand() < 0.1 ? 1.8 : 0.6 + bandRand() * 0.9;
        ctx.globalAlpha = 0.35 + bandRand() * 0.65; circle(ctx, bandRand() * W, top + bandRand() * extra, r); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  skyGradient(ctx, H, t);
  switch (t.painter) {
    case 'castle': case 'control': {
      const control = t.painter === 'control';
      // Back wall diamond pattern.
      ctx.save(); ctx.globalAlpha = 0.12; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      const span = H - top;
      for (let x = -span; x < W + span; x += 48) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + span, H); ctx.moveTo(x + span, top); ctx.lineTo(x, H); ctx.stroke(); }
      ctx.restore();
      for (const cx of [160, 480, 800]) {
        // Arched window (or glowing screen in the control room).
        const wx = cx - 70, wy = 120, ww = 140, wh = 260;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(wx, wy + 70); ctx.arc(cx, wy + 70, 70, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.lineTo(wx, wy + wh); ctx.closePath();
        softShadow(ctx, 10, 0, control ? 'rgba(120,230,255,0.9)' : 'rgba(255,255,255,0.8)');
        ctx.fillStyle = control
          ? lin(ctx, 0, wy, 0, wy + wh, [[0, '#dffaff'], [1, '#68d4ff']])
          : lin(ctx, 0, wy, 0, wy + wh, [[0, '#bfe8ff'], [0.6, '#ffe6f4'], [1, '#ffd0ea']]);
        ctx.fill(); noShadow(ctx);
        ctx.strokeStyle = control ? '#7a3aa0' : '#d4569d'; ctx.lineWidth = 8; ctx.stroke();
        ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx, wy); ctx.lineTo(cx, wy + wh); ctx.moveTo(wx, wy + 150); ctx.lineTo(wx + ww, wy + 150); ctx.stroke();
        if (control) {
          ctx.fillStyle = 'rgba(40,90,140,0.45)'; ctx.font = 'bold 16px "Avenir Next", Arial, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('• CONTROL •', cx, wy + 200);
        } else {
          for (const [px, py] of [[cx - 30, wy + 60], [cx + 34, wy + 110]]) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; circle(ctx, px, py, 10); ctx.fill(); circle(ctx, px + 12, py - 4, 13); ctx.fill(); }
        }
        ctx.restore();
        // Light beam onto the floor.
        ctx.save(); ctx.globalAlpha = control ? 0.12 : 0.2;
        ctx.beginPath(); ctx.moveTo(wx + 10, wy + wh); ctx.lineTo(wx + ww - 10, wy + wh); ctx.lineTo(wx + ww + 60, H); ctx.lineTo(wx + 40, H); ctx.closePath();
        ctx.fillStyle = lin(ctx, 0, wy + wh, 0, H, [[0, '#ffffff'], [1, 'rgba(255,255,255,0)']]); ctx.fill();
        ctx.restore();
      }
      for (const cx of [0, 320, 640]) {
        wrap(cx, 50, x => {
          ctx.fillStyle = lin(ctx, x - 34, 0, x + 34, 0, [[0, control ? '#9a52c8' : '#e45aa6'], [0.45, control ? '#e6c6ff' : '#ffc4e4'], [1, control ? '#7a3aa0' : '#c8408c']]);
          ctx.fillRect(x - 34, top + 70, 68, H - top);
          roundRect(ctx, x - 46, top + 60, 92, 26, 6); ctx.fillStyle = control ? '#c99af0' : '#ff9fd2'; ctx.fill();
          // Banner with a heart emblem.
          ctx.beginPath(); ctx.moveTo(x - 22, 110); ctx.lineTo(x + 22, 110); ctx.lineTo(x + 22, 210); ctx.lineTo(x, 194); ctx.lineTo(x - 22, 210); ctx.closePath();
          ctx.fillStyle = lin(ctx, 0, 110, 0, 210, [[0, '#ffe680'], [1, '#e8a91c']]); ctx.fill();
          ctx.save(); ctx.translate(x, 148); ctx.scale(0.5, 0.5);
          ctx.beginPath(); ctx.moveTo(0, 18); ctx.bezierCurveTo(-30, -2, -14, -24, 0, -8); ctx.bezierCurveTo(14, -24, 30, -2, 0, 18); ctx.closePath();
          ctx.fillStyle = control ? '#7a3aa0' : '#ff4fa0'; ctx.fill(); ctx.restore();
        });
      }
      // Crown molding along the top.
      ctx.fillStyle = lin(ctx, 0, top, 0, top + 56, [[0, control ? '#b07ae0' : '#f27ab8'], [1, control ? '#e2c4ff' : '#ffd0ea']]); ctx.fillRect(0, top, W, 56);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      for (let x = 12; x < W; x += 24) { circle(ctx, x, top + 50, 5); ctx.fill(); }
      break;
    }
    case 'rainbow': {
      const cols = ['#ff6a6a', '#ffab52', '#ffe066', '#5fdc8a', '#5fbfff', '#a37bff'];
      ctx.save();
      softShadow(ctx, 30, 0, 'rgba(255,255,255,0.9)');
      cols.forEach((c, i) => {
        ctx.strokeStyle = c; ctx.globalAlpha = 0.55; ctx.lineWidth = 30;
        ctx.beginPath(); ctx.arc(480, 640, 560 - i * 30, Math.PI, 0); ctx.stroke();
      });
      ctx.restore();
      sparkles(ctx, rand, 40, 420);
      cloud(ctx, 90, 140, 0.9, 0.95); cloud(ctx, 420, 90, 0.7, 0.9); cloud(ctx, 700, 170, 1.1, 0.95); cloud(ctx, 300, 330, 0.8, 0.85);
      break;
    }
    case 'clouds': {
      sun(ctx, 780, 110, 42, '#fff4b0', 'rgba(255,250,200,0.55)');
      lightRays(ctx, 520, 3, 'rgba(255,255,230,1)', H);
      cloud(ctx, 120, 120, 0.8, 0.9, '#d8e6fa'); cloud(ctx, 460, 70, 0.6, 0.85, '#d8e6fa');
      cloud(ctx, 60, 400, 1.8, 1, '#c8dcf6'); cloud(ctx, 330, 430, 2.1, 1, '#c8dcf6'); cloud(ctx, 640, 410, 1.9, 1, '#c8dcf6'); cloud(ctx, 880, 440, 1.6, 1, '#c8dcf6');
      cloud(ctx, 250, 260, 1.0, 0.9, '#d8e6fa'); cloud(ctx, 720, 280, 1.2, 0.9, '#d8e6fa');
      break;
    }
    case 'hills': case 'meadow': case 'final': {
      const final = t.painter === 'final';
      sun(ctx, final ? 760 : 790, final ? 330 : 100, final ? 70 : 40, final ? '#ffe2a0' : '#fff4b0', final ? 'rgba(255,200,150,0.6)' : 'rgba(255,250,200,0.5)');
      cloud(ctx, 110, 120, 0.9, 0.95); cloud(ctx, 430, 80, 0.7, 0.9); cloud(ctx, 610, 170, 0.8, 0.85);
      if (final) {
        hills(ctx, 400, 26, 2, 0.5, H, '#ffb6c8', '#f08ab0');
        // Giant flower silhouettes.
        for (const [x, h, r, col] of [[90, 260, 46, '#ff7ab8'], [300, 200, 34, '#c78bff'], [560, 280, 52, '#ff9a6a'], [800, 220, 40, '#ff7ab8']] as const) {
          wrap(x, r + 10, cx => {
            ctx.strokeStyle = '#4f9a5a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, H); ctx.quadraticCurveTo(cx + 20, H - h * 0.5, cx, H - h); ctx.stroke();
            for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; circle(ctx, cx + Math.cos(a) * r * 0.7, H - h + Math.sin(a) * r * 0.7, r * 0.55); ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fill(); }
            ctx.globalAlpha = 1; circle(ctx, cx, H - h, r * 0.45); ctx.fillStyle = '#ffe066'; ctx.fill();
          });
        }
        hills(ctx, 470, 18, 3, 1.2, H, '#e58aa8', '#c46a8e');
      } else {
        hills(ctx, 360, 30, 2, 0.3, H, '#bfe8c8', '#a6d8b4');
        hills(ctx, 410, 28, 3, 1.4, H, t.painter === 'meadow' ? '#9fe08a' : '#8fd69a', '#62b06a');
        for (let i = 0; i < 18; i++) roundTree(ctx, rand() * W, 400 + rand() * 30, 18 + rand() * 10, 10 + rand() * 6, '#7fcf86', '#3f9a52', '#6a4a2a');
      }
      break;
    }
    case 'night': {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = lin(ctx, 0, 60, W, 300, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(220,200,255,0.8)'], [1, 'rgba(255,255,255,0)']]);
      ctx.beginPath(); ctx.moveTo(0, 220); ctx.quadraticCurveTo(480, 60, W, 160); ctx.lineTo(W, 230); ctx.quadraticCurveTo(480, 130, 0, 290); ctx.closePath(); ctx.fill();
      ctx.restore();
      for (let i = 0; i < 140; i++) {
        const x = rand() * W, y = rand() * 380, r = rand() < 0.1 ? 1.8 : 0.6 + rand() * 1;
        ctx.globalAlpha = 0.35 + rand() * 0.65; circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
      sparkles(ctx, rand, 10, 300, '#fff6c8');
      // Moon with glow and craters.
      sun(ctx, 760, 110, 44, '#fff6d0', 'rgba(255,246,200,0.35)');
      for (const [dx, dy, r] of [[-14, -8, 7], [12, 10, 9], [8, -18, 5]]) { circle(ctx, 760 + dx, 110 + dy, r); ctx.fillStyle = 'rgba(220,200,140,0.35)'; ctx.fill(); }
      hills(ctx, 410, 40, 2, 0.8, H, '#2e2a74', '#1a1648');
      hills(ctx, 450, 24, 3, 2.1, H, '#26236a', '#141240');
      for (let i = 0; i < 16; i++) { const x = rand() * W, y = 440 + rand() * 60; circle(ctx, x, y, 2); ctx.fillStyle = '#ffd6f4'; ctx.globalAlpha = 0.8; ctx.fill(); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'forest': {
      sun(ctx, 820, 70, 34, '#fff8d0', 'rgba(255,250,210,0.6)');
      lightRays(ctx, 560, 3, 'rgba(255,255,220,1)', H);
      for (let i = 0; i < 16; i++) pine(ctx, i * 62 + rand() * 30, 470, 200 + rand() * 80, 90, '#a8d8b4', '#8cc49c');
      for (let i = 0; i < 12; i++) roundTree(ctx, i * 84 + rand() * 30, 520, 150 + rand() * 60, 55 + rand() * 15, '#6cba7c', '#3f8a52', '#5a3e24');
      ctx.fillStyle = lin(ctx, 0, 380, 0, H, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,240,0.6)']]); ctx.fillRect(0, 380, W, H - 380);
      break;
    }
    case 'zoo': {
      sun(ctx, 760, 150, 60, '#fff0b0', 'rgba(255,220,140,0.55)');
      hills(ctx, 400, 22, 2, 0.4, H, '#d6e08a', '#b0c862');
      // Acacia trees and a giraffe peeking over the hills.
      for (const x of [140, 520, 860]) {
        wrap(x, 90, cx => {
          ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(cx, 420); ctx.quadraticCurveTo(cx + 6, 360, cx - 10, 320); ctx.moveTo(cx + 2, 370); ctx.quadraticCurveTo(cx + 20, 340, cx + 34, 322); ctx.stroke();
          ctx.fillStyle = lin(ctx, 0, 296, 0, 330, [[0, '#8fc85a'], [1, '#5a9a3a']]);
          ctx.beginPath(); ctx.ellipse(cx + 10, 316, 80, 18, 0, 0, Math.PI * 2); ctx.fill();
        });
      }
      wrap(340, 40, cx => {
        ctx.fillStyle = '#f2b84a';
        ctx.fillRect(cx - 7, 280, 14, 130);
        ctx.beginPath(); ctx.ellipse(cx + 10, 276, 22, 12, -0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b8742a'; for (const [dx, dy] of [[0, 300], [-2, 330], [2, 360], [0, 390]]) { circle(ctx, cx + dx, dy, 4.5); ctx.fill(); }
        ctx.fillStyle = '#7a4a1a'; ctx.fillRect(cx - 2, 254, 3, 12); ctx.fillRect(cx + 6, 254, 3, 12);
        circle(ctx, cx + 18, 272, 2.5); ctx.fillStyle = '#2a1a0a'; ctx.fill();
      });
      hills(ctx, 440, 14, 3, 1.7, H, '#b8d070', '#94b450');
      // Wooden zoo fence.
      for (let x = 0; x < W; x += 30) { ctx.fillStyle = lin(ctx, x, 0, x + 9, 0, [[0, '#a8743e'], [1, '#d9a468']]); roundRect(ctx, x, 408, 9, 72, 3); ctx.fill(); }
      ctx.fillStyle = '#b8823e'; ctx.fillRect(0, 418, W, 7); ctx.fillRect(0, 448, W, 7);
      break;
    }
    case 'river': {
      sun(ctx, 800, 90, 38, '#fff6c0', 'rgba(255,250,210,0.5)');
      cloud(ctx, 160, 110, 0.9); cloud(ctx, 520, 70, 0.7, 0.9);
      hills(ctx, 330, 34, 2, 0.6, H, '#a6dcb8', '#88c49c');
      // Distant stone bridge.
      ctx.fillStyle = '#b8c2d0';
      ctx.fillRect(230, 352, 300, 18);
      ctx.fillStyle = '#9aa6b8';
      for (const ax of [280, 380, 480]) { ctx.beginPath(); ctx.moveTo(ax - 44, 400); ctx.lineTo(ax - 44, 370); ctx.lineTo(ax + 44, 370); ctx.lineTo(ax + 44, 400); ctx.arc(ax, 400, 34, 0, Math.PI, true); ctx.closePath(); ctx.fill(); }
      // River with shimmer.
      ctx.fillStyle = lin(ctx, 0, 392, 0, H, [[0, '#7fd0ff'], [1, '#3a9ae0']]); ctx.fillRect(0, 392, W, H - 392);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2.5;
      for (let i = 0; i < 40; i++) { const x = rand() * W, y = 402 + rand() * 130, l = 14 + rand() * 30; ctx.globalAlpha = 0.4 + rand() * 0.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      break;
    }
    case 'orchard': {
      sun(ctx, 160, 100, 40, '#fff4b0', 'rgba(255,250,200,0.55)');
      cloud(ctx, 460, 90, 0.8); cloud(ctx, 780, 140, 0.9);
      hills(ctx, 380, 24, 2, 0.9, H, '#c6e89a', '#a6d47a');
      for (let i = 0; i < 14; i++) roundTree(ctx, i * 70 + rand() * 20, 430, 34, 30, '#9fd87a', '#5aa44a', '#7a5a34', '#ff6a5a', rand);
      hills(ctx, 450, 12, 3, 2, H, '#a6d47a', '#86bc5a');
      for (let i = 0; i < 10; i++) roundTree(ctx, i * 98 + rand() * 30, 500, 50, 44, '#86d066', '#3f9a3a', '#6a4a24', '#ff4f3f', rand);
      break;
    }
    case 'town': {
      sun(ctx, 480, 420, 70, '#ffe2b0', 'rgba(255,210,170,0.6)');
      cloud(ctx, 140, 110, 0.8, 0.8, '#f0c8e6'); cloud(ctx, 760, 80, 0.7, 0.8, '#f0c8e6');
      for (let i = 0; i < 9; i++) {
        const x = i * 110 + rand() * 20, h = 170 + rand() * 120, w = 80 + rand() * 30;
        wrap(x, w, cx => {
          ctx.fillStyle = lin(ctx, cx, 0, cx + w, 0, [[0, '#8f80c8'], [0.5, '#b4a6e6'], [1, '#7f70b8']]); ctx.fillRect(cx, 540 - h, w, h);
          ctx.fillStyle = '#6a5aa8'; ctx.beginPath(); ctx.moveTo(cx - 8, 540 - h); ctx.lineTo(cx + w / 2, 540 - h - 46); ctx.lineTo(cx + w + 8, 540 - h); ctx.closePath(); ctx.fill();
          softShadow(ctx, 8, 0, 'rgba(255,220,120,0.9)');
          ctx.fillStyle = '#ffe28a';
          for (let wy = 540 - h + 24; wy < 500; wy += 44) for (let wx = cx + 14; wx < cx + w - 18; wx += 28) if (rand() > 0.3) { roundRect(ctx, wx, wy, 14, 20, 3); ctx.fill(); }
          noShadow(ctx);
        });
      }
      // Clock tower.
      ctx.fillStyle = lin(ctx, 430, 0, 530, 0, [[0, '#7a6ab8'], [0.5, '#a898e0'], [1, '#6a5aa8']]); ctx.fillRect(440, 150, 80, 390);
      ctx.fillStyle = '#5a4a98'; ctx.beginPath(); ctx.moveTo(430, 150); ctx.lineTo(480, 80); ctx.lineTo(530, 150); ctx.closePath(); ctx.fill();
      softShadow(ctx, 14, 0, 'rgba(255,240,180,0.9)');
      circle(ctx, 480, 200, 28); ctx.fillStyle = '#fff6dc'; ctx.fill();
      noShadow(ctx);
      ctx.strokeStyle = '#4a3a88'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(480, 200); ctx.lineTo(480, 182); ctx.moveTo(480, 200); ctx.lineTo(494, 206); ctx.stroke();
      break;
    }
    case 'christmas': {
      // Starry dusk with a big moon and a sleigh flying across it.
      for (let i = 0; i < 120; i++) {
        const x = rand() * W, y = rand() * 300, r = rand() < 0.1 ? 1.8 : 0.6 + rand() * 0.9;
        ctx.globalAlpha = 0.35 + rand() * 0.65; circle(ctx, x, y, r); ctx.fillStyle = '#ffffff'; ctx.fill();
      }
      ctx.globalAlpha = 1;
      sparkles(ctx, rand, 10, 260, '#fff6c8');
      sun(ctx, 760, 116, 48, '#fff6d6', 'rgba(255,240,210,0.35)');
      sleigh(ctx, 712, 112);
      // Snowy mountains.
      ctx.fillStyle = lin(ctx, 0, 250, 0, 420, [[0, '#8a92d4'], [1, '#6a70b8']]);
      ctx.beginPath(); ctx.moveTo(0, 420);
      const peaks = [[0, 330], [120, 260], [230, 320], [360, 240], [500, 330], [620, 270], [760, 320], [880, 250], [960, 330]];
      for (const [x, y] of peaks) ctx.lineTo(x, y);
      ctx.lineTo(W, 420); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      for (const [x, y] of peaks.slice(1, -1)) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 34, y + 30); ctx.lineTo(x + 16, y + 24); ctx.lineTo(x, y + 34); ctx.lineTo(x - 14, y + 24); ctx.lineTo(x - 32, y + 30); ctx.closePath(); ctx.fill();
      }
      hills(ctx, 400, 16, 2, 0.5, H, '#dfe6fb', '#b8c4ec');
      // Little village with snowy roofs, glowing windows and wreaths.
      for (let i = 0; i < 7; i++) {
        const x = i * 140 + rand() * 40, w = 58 + rand() * 26, h = 40 + rand() * 22, col = ['#d9566a', '#5aa86a', '#e8c98a', '#8a7ad0'][i % 4];
        wrap(x, w, cx => {
          const base = 412;
          ctx.fillStyle = lin(ctx, cx, 0, cx + w, 0, [[0, col], [1, 'rgba(40,30,80,0.55)']]); ctx.fillRect(cx, base - h, w, h);
          ctx.fillStyle = col; ctx.globalAlpha = 0.6; ctx.fillRect(cx, base - h, w * 0.6, h); ctx.globalAlpha = 1;
          ctx.fillStyle = '#6a4a3a'; ctx.fillRect(cx + w * 0.7, base - h - 26, 9, 18);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.moveTo(cx - 8, base - h + 2); ctx.lineTo(cx + w / 2, base - h - 30); ctx.lineTo(cx + w + 8, base - h + 2); ctx.closePath(); ctx.fill();
          softShadow(ctx, 8, 0, 'rgba(255,220,120,0.95)');
          ctx.fillStyle = '#ffe28a';
          roundRect(ctx, cx + 8, base - h + 12, 12, 13, 2); ctx.fill();
          roundRect(ctx, cx + w - 20, base - h + 12, 12, 13, 2); ctx.fill();
          noShadow(ctx);
          ctx.fillStyle = '#5a3424'; roundRect(ctx, cx + w / 2 - 6, base - 20, 12, 20, 5); ctx.fill();
          circle(ctx, cx + w / 2, base - h - 8, 5); ctx.strokeStyle = '#2f9a4a'; ctx.lineWidth = 3; ctx.stroke();
          // Chimney smoke.
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          for (let k = 0; k < 3; k++) { circle(ctx, cx + w * 0.7 + 5 + k * 6, base - h - 34 - k * 12, 5 + k * 2); ctx.fill(); }
        });
      }
      // Snowy fir trees with tiny lights.
      for (let i = 0; i < 12; i++) {
        const x = i * 82 + rand() * 30, th = 70 + rand() * 50;
        pine(ctx, x, 452, th, 46, '#3f8a5c', '#1f5a3a');
        wrap(x, 30, cx => {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          for (let k = 0; k < 3; k++) { const ty = 452 - th + k * th * 0.22 + th * 0.45; ctx.fillRect(cx - (46 * (0.55 + k * 0.25)) / 2 + 3, ty - 3, 46 * (0.55 + k * 0.25) - 6, 3); }
          for (let k = 0; k < 5; k++) {
            const col = ['#fff3a0', '#ff9aa6', '#9fe0ff'][k % 3];
            softShadow(ctx, 5, 0, col); circle(ctx, cx - 12 + ((k * 13) % 24), 452 - th * (0.25 + (k % 3) * 0.2), 1.6); ctx.fillStyle = col; ctx.fill();
          }
          noShadow(ctx);
        });
      }
      hills(ctx, 470, 12, 3, 1.6, H, '#ffffff', '#d4ddf6');
      break;
    }
  }
  // Gentle horizon haze over everything.
  ctx.fillStyle = lin(ctx, 0, 300, 0, H, [[0, 'rgba(255,255,255,0)'], [1, t.painter === 'night' ? 'rgba(90,70,170,0.25)' : 'rgba(255,255,255,0.25)']]);
  ctx.fillRect(0, 300, W, H - 300);
}

// ------------------------------------------------------------ mid layers

function paintMid(ctx: Ctx, t: Theme): void {
  const H = 260;
  const rand = rng(t.painter.length * 131 + 7);
  softShadow(ctx, 8, 3, 'rgba(30,10,60,0.18)');
  switch (t.painter) {
    case 'castle': case 'control': {
      const control = t.painter === 'control';
      for (let x = 0; x < W; x += 240) {
        wrap(x + 60, 60, cx => {
          // Potted topiary on a pedestal.
          ctx.fillStyle = lin(ctx, cx - 26, 0, cx + 26, 0, [[0, control ? '#8a4ab0' : '#c8408c'], [0.5, control ? '#d8a8f8' : '#ff9fd2'], [1, control ? '#6a2f8a' : '#a8357a']]);
          roundRect(ctx, cx - 26, 170, 52, 90, 6); ctx.fill();
          circle(ctx, cx, 140, 40); ctx.fillStyle = rad(ctx, cx, 140, 40, [[0, '#8fe08a'], [1, '#3f9a52']], cx - 12, 126); ctx.fill();
          for (let k = 0; k < 5; k++) { circle(ctx, cx - 22 + k * 11, 128 + (k % 2) * 16, 4); ctx.fillStyle = control ? '#7fe0ff' : '#ff7ac0'; ctx.fill(); }
        });
        wrap(x + 180, 30, cx => {
          // Glowing lantern on a stand.
          ctx.fillStyle = control ? '#5a2a7a' : '#8a2a60'; ctx.fillRect(cx - 3, 120, 6, 140);
          softShadow(ctx, 16, 0, control ? 'rgba(120,230,255,0.9)' : 'rgba(255,230,140,0.95)');
          roundRect(ctx, cx - 12, 98, 24, 30, 8); ctx.fillStyle = control ? '#b8f4ff' : '#fff1a0'; ctx.fill();
          softShadow(ctx, 8, 3, 'rgba(30,10,60,0.18)');
        });
      }
      break;
    }
    case 'rainbow': case 'final': {
      for (let i = 0; i < 7; i++) {
        const x = i * 140 + rand() * 40, h = 110 + rand() * 70, r = 34 + rand() * 18;
        const col = ['#ffb3dc', '#b8e4ff', '#d9c2ff', '#ffe0a8'][i % 4];
        wrap(x, r + 6, cx => {
          ctx.fillStyle = lin(ctx, cx - 4, 0, cx + 4, 0, [[0, '#ffffff'], [1, '#f0d8ea']]); ctx.fillRect(cx - 4, H - h, 8, h);
          circle(ctx, cx, H - h, r); ctx.fillStyle = rad(ctx, cx, H - h, r, [[0, '#ffffff'], [0.4, col], [1, col]], cx - r * 0.4, H - h - r * 0.4); ctx.fill();
        });
      }
      break;
    }
    case 'clouds': {
      noShadow(ctx);
      for (let i = 0; i < 6; i++) cloud(ctx, i * 170 + rand() * 40, 200 + rand() * 30, 1.2 + rand() * 0.5, 1, '#c8dcf6');
      break;
    }
    case 'hills': case 'meadow': {
      noShadow(ctx);
      hills(ctx, 170, 22, 3, 0.6, H, t.painter === 'meadow' ? '#8fd87a' : '#7fcf86', '#4fa85c');
      for (let i = 0; i < 9; i++) {
        const x = i * 110 + rand() * 40;
        wrap(x, 40, cx => {
          for (const [dx, dy, r] of [[-18, 6, 20], [0, -4, 26], [20, 6, 20]]) { circle(ctx, cx + dx, 196 + dy, r); ctx.fillStyle = rad(ctx, cx + dx, 196 + dy, r, [[0, '#8fe08a'], [1, '#3f9a52']], cx + dx - 6, 186 + dy); ctx.fill(); }
          for (let k = 0; k < 4; k++) { circle(ctx, cx - 20 + k * 13, 186 + (k % 2) * 12, 3.5); ctx.fillStyle = ['#ff7ac0', '#ffe066', '#ffffff', '#b48aff'][k]; ctx.fill(); }
        });
      }
      break;
    }
    case 'night': {
      noShadow(ctx);
      hills(ctx, 180, 26, 2, 1.1, H, '#2c2a78', '#1a1650');
      for (let i = 0; i < 10; i++) {
        const x = i * 100 + rand() * 40, h = 20 + rand() * 20;
        wrap(x, 20, cx => {
          ctx.fillStyle = '#e8e0ff'; ctx.fillRect(cx - 3, 220 - h, 6, h);
          softShadow(ctx, 14, 0, 'rgba(255,170,240,0.95)');
          ctx.beginPath(); ctx.ellipse(cx, 220 - h, 14, 9, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ff9fe0'; ctx.fill();
          noShadow(ctx);
          for (const dx of [-6, 3, 8]) { circle(ctx, cx + dx, 214 - h, 1.8); ctx.fillStyle = '#ffffff'; ctx.fill(); }
        });
      }
      break;
    }
    case 'forest': {
      for (let i = 0; i < 8; i++) {
        const x = i * 125 + rand() * 30;
        wrap(x, 60, cx => {
          ctx.fillStyle = lin(ctx, cx - 14, 0, cx + 14, 0, [[0, '#4a3018'], [0.5, '#8a6038'], [1, '#3a240e']]); ctx.fillRect(cx - 12, 40, 24, H);
          circle(ctx, cx, 40, 56); ctx.fillStyle = rad(ctx, cx, 40, 56, [[0, '#5cb06a'], [1, '#2a6a3a']], cx - 18, 20); ctx.fill();
        });
      }
      noShadow(ctx);
      for (let i = 0; i < 12; i++) {
        const x = rand() * W;
        wrap(x, 12, cx => {
          ctx.fillStyle = '#f6e6d0'; ctx.fillRect(cx - 2, 236, 4, 12);
          ctx.beginPath(); ctx.ellipse(cx, 236, 10, 7, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#ff5a5a'; ctx.fill();
          ctx.fillStyle = '#ffffff'; circle(ctx, cx - 3, 232, 1.6); ctx.fill(); circle(ctx, cx + 4, 233, 1.3); ctx.fill();
        });
      }
      break;
    }
    case 'zoo': {
      for (let i = 0; i < 5; i++) {
        const x = i * 200 + rand() * 60;
        wrap(x, 80, cx => {
          ctx.strokeStyle = lin(ctx, 0, 60, 0, H, [[0, '#c08a50'], [1, '#7a5230']]); ctx.lineWidth = 12;
          ctx.beginPath(); ctx.moveTo(cx, H); ctx.quadraticCurveTo(cx + 14, 140, cx + 4, 60); ctx.stroke();
          noShadow(ctx);
          for (let k = 0; k < 6; k++) {
            const a = -Math.PI / 2 + (k - 2.5) * 0.55;
            ctx.fillStyle = lin(ctx, cx, 40, cx + Math.cos(a) * 70, 60 + Math.sin(a) * 40, [[0, '#7cc85a'], [1, '#3f8a2a']]);
            ctx.beginPath(); ctx.ellipse(cx + 4 + Math.cos(a) * 34, 60 + Math.sin(a) * 18 + 10, 40, 10, a + Math.PI / 2 + 1.4, 0, Math.PI * 2); ctx.fill();
          }
          softShadow(ctx, 8, 3, 'rgba(30,10,60,0.18)');
        });
      }
      noShadow(ctx);
      for (let i = 0; i < 9; i++) { const x = rand() * W; wrap(x, 30, cx => { for (const [dx, r] of [[-12, 16], [6, 20], [22, 14]]) { circle(ctx, cx + dx, 236, r); ctx.fillStyle = rad(ctx, cx + dx, 236, r, [[0, '#9ad46a'], [1, '#4f8a2a']], cx + dx - 5, 226); ctx.fill(); } }); }
      break;
    }
    case 'river': {
      noShadow(ctx);
      for (let i = 0; i < 9; i++) {
        const x = i * 110 + rand() * 40, w = 40 + rand() * 40;
        wrap(x, w, cx => { ctx.beginPath(); ctx.ellipse(cx, 238, w, 16, 0, 0, Math.PI * 2); ctx.fillStyle = rad(ctx, cx, 232, w, [[0, '#d8dee8'], [1, '#7a8698']], cx - 10, 228); ctx.fill(); });
      }
      for (let i = 0; i < 24; i++) {
        const x = rand() * W, h = 30 + rand() * 40;
        wrap(x, 6, cx => { ctx.strokeStyle = '#5a9a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, H); ctx.quadraticCurveTo(cx + 6, H - h / 2, cx + 2, H - h); ctx.stroke(); ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.ellipse(cx + 2, H - h, 3.5, 9, 0, 0, Math.PI * 2); ctx.fill(); });
      }
      break;
    }
    case 'orchard': {
      for (let i = 0; i < 6; i++) roundTree(ctx, i * 165 + rand() * 40, H, 110, 58, '#7ccf5a', '#2f8a32', '#6a4a24', '#ff4a3a', rand);
      break;
    }
    case 'town': {
      for (let i = 0; i < 6; i++) {
        const x = i * 160 + rand() * 30;
        wrap(x, 30, cx => {
          ctx.fillStyle = '#3a2f60'; ctx.fillRect(cx - 3, 120, 6, 140);
          softShadow(ctx, 18, 0, 'rgba(255,220,120,0.95)');
          circle(ctx, cx, 112, 12); ctx.fillStyle = '#fff1b0'; ctx.fill();
          softShadow(ctx, 8, 3, 'rgba(30,10,60,0.18)');
          ctx.fillStyle = '#3a2f60'; roundRect(ctx, cx - 14, 96, 28, 6, 3); ctx.fill();
        });
      }
      break;
    }
    case 'christmas': {
      noShadow(ctx);
      const base = 214;
      // Decorated Christmas trees.
      for (const [x, h] of [[110, 170], [575, 150]] as const) wrap(x, 60, cx => drawChristmasTree(ctx, cx, base, h, h * 0.68, false));
      // Lamp posts with a wreath and a golden bell.
      for (const x of [330, 805]) {
        wrap(x, 30, cx => {
          ctx.fillStyle = lin(ctx, cx - 4, 0, cx + 4, 0, [[0, '#2a2a40'], [0.5, '#5a5a78'], [1, '#1a1a2a']]); ctx.fillRect(cx - 4, 70, 8, base - 70);
          ctx.fillStyle = '#2a2a40'; roundRect(ctx, cx - 14, 62, 28, 8, 3); ctx.fill();
          softShadow(ctx, 20, 0, 'rgba(255,220,130,0.95)');
          roundRect(ctx, cx - 10, 40, 20, 24, 5); ctx.fillStyle = '#fff1b0'; ctx.fill();
          noShadow(ctx);
          ctx.beginPath(); ctx.moveTo(cx - 14, 40); ctx.lineTo(cx, 28); ctx.lineTo(cx + 14, 40); ctx.closePath(); ctx.fillStyle = '#2a2a40'; ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, 30, 12, 4, 0, Math.PI, 0); ctx.fill();
          // Wreath.
          for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; circle(ctx, cx + Math.cos(a) * 15, 112 + Math.sin(a) * 15, 6); ctx.fillStyle = k % 2 ? '#2f9a4a' : '#1f7a3a'; ctx.fill(); }
          for (const a of [0.5, 2.2, 3.9, 5.4]) { circle(ctx, cx + Math.cos(a) * 15, 112 + Math.sin(a) * 15, 2.4); ctx.fillStyle = '#e8394d'; ctx.fill(); }
          ctx.fillStyle = '#e8394d';
          for (const dir of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, 128); ctx.bezierCurveTo(cx + dir * 12, 118, cx + dir * 13, 136, cx, 128); ctx.fill(); }
          // Bell under the wreath.
          ctx.beginPath(); ctx.moveTo(cx - 3, 132); ctx.quadraticCurveTo(cx - 8, 140, cx - 10, 150); ctx.lineTo(cx + 10, 150); ctx.quadraticCurveTo(cx + 8, 140, cx + 3, 132); ctx.closePath();
          ctx.fillStyle = lin(ctx, cx - 10, 0, cx + 10, 0, [[0, '#b8800e'], [0.4, '#fff1a0'], [1, '#b8800e']]); ctx.fill();
          circle(ctx, cx, 152, 2.6); ctx.fillStyle = '#b8800e'; ctx.fill();
        });
      }
      // Snowman.
      wrap(450, 40, cx => {
        for (const [dy, r] of [[-22, 24], [-56, 17], [-82, 12]] as const) {
          circle(ctx, cx, base + dy, r); ctx.fillStyle = rad(ctx, cx, base + dy, r, [[0, '#ffffff'], [1, '#c8d0ee']], cx - r * 0.3, base + dy - r * 0.4); ctx.fill();
        }
        ctx.fillStyle = '#2a2a3a'; for (const dx of [-4, 4]) { circle(ctx, cx + dx, base - 85, 1.8); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(cx, base - 81); ctx.lineTo(cx + 12, base - 79); ctx.lineTo(cx, base - 78); ctx.closePath(); ctx.fillStyle = '#ff8a3c'; ctx.fill();
        ctx.fillStyle = '#e8394d'; roundRect(ctx, cx - 13, base - 72, 26, 6, 3); ctx.fill(); ctx.fillRect(cx + 4, base - 70, 6, 16);
        ctx.fillStyle = '#1a1a2a'; ctx.fillRect(cx - 12, base - 96, 24, 4); ctx.fillRect(cx - 8, base - 112, 16, 16);
      });
      // Gingerbread house with icing trim and candy.
      wrap(700, 70, cx => {
        const w = 104, h = 66, top = base - h;
        ctx.fillStyle = lin(ctx, cx - w / 2, 0, cx + w / 2, 0, [[0, '#d08a48'], [0.5, '#e8a868'], [1, '#a8682e']]); ctx.fillRect(cx - w / 2, top, w, h);
        ctx.beginPath(); ctx.moveTo(cx - w / 2 - 12, top + 4); ctx.lineTo(cx, top - 46); ctx.lineTo(cx + w / 2 + 12, top + 4); ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx - w / 2 - 4, top + 2); ctx.lineTo(cx, top - 36); ctx.lineTo(cx + w / 2 + 4, top + 2); ctx.closePath(); ctx.fillStyle = '#b8743a'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(cx - w / 2 + 8 + k * 18, top + 2, 8, 0, Math.PI); ctx.stroke(); }
        for (const [dx, dy, col] of [[-36, 18, '#e8394d'], [36, 18, '#2fa65a'], [-20, -16, '#ffd84d'], [20, -16, '#e8394d'], [0, -28, '#5fb3ff']] as const) { circle(ctx, cx + dx, top + dy, 4); ctx.fillStyle = col; ctx.fill(); }
        softShadow(ctx, 8, 0, 'rgba(255,220,120,0.9)');
        ctx.fillStyle = '#ffe28a'; roundRect(ctx, cx - 40, top + 30, 16, 16, 3); ctx.fill(); roundRect(ctx, cx + 24, top + 30, 16, 16, 3); ctx.fill();
        noShadow(ctx);
        ctx.fillStyle = '#6a3a1e'; roundRect(ctx, cx - 10, base - 32, 20, 32, 9); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, base - 22, 10, Math.PI, 0); ctx.stroke();
      });
      // Snow drifts burying everything's feet.
      hills(ctx, base + 4, 8, 4, 1.1, H, '#ffffff', '#d8e0f8');
      break;
    }
  }
  noShadow(ctx);
}

/** A tiny sleigh pulled by three reindeer, in silhouette against the moon. */
function sleigh(ctx: Ctx, x: number, y: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(40,40,90,0.85)'; ctx.strokeStyle = 'rgba(40,40,90,0.85)';
  for (let i = 0; i < 3; i++) {
    const rx = x + i * 20, ry = y + i * 2.5;
    ctx.beginPath(); ctx.ellipse(rx, ry, 7, 3.2, -0.15, 0, Math.PI * 2); ctx.fill();
    circle(ctx, rx - 7, ry - 4, 2.4); ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(rx - 7, ry - 6); ctx.lineTo(rx - 9, ry - 10); ctx.moveTo(rx - 8, ry - 8); ctx.lineTo(rx - 11, ry - 8);
    ctx.moveTo(rx - 4, ry + 2); ctx.lineTo(rx - 7, ry + 6); ctx.moveTo(rx + 4, ry + 2); ctx.lineTo(rx + 7, ry + 6); ctx.stroke();
  }
  ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x + 46, y + 5); ctx.lineTo(x + 66, y + 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 64, y + 4); ctx.lineTo(x + 86, y + 4); ctx.quadraticCurveTo(x + 90, y + 14, x + 80, y + 16); ctx.lineTo(x + 66, y + 16); ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x + 62, y + 19); ctx.lineTo(x + 86, y + 19); ctx.quadraticCurveTo(x + 92, y + 19, x + 92, y + 14); ctx.stroke();
  ctx.restore();
}

// ------------------------------------------------------------ ground

function paintGround(ctx: Ctx, t: Theme): void {
  const TW = 128, TH = 90;
  const g = t.ground;
  const rand = rng(TW + g.soil.length * 31 + t.painter.length);
  // Soil body.
  ctx.fillStyle = lin(ctx, 0, 0, 0, TH, [[0, g.soil], [1, g.soilDark]]); ctx.fillRect(0, 0, TW, TH);
  const tileWrap = (x: number, r: number, draw: (x: number) => void): void => { draw(x); if (x - r < 0) draw(x + TW); if (x + r > TW) draw(x - TW); };
  switch (g.style) {
    case 'grass': case 'sand': {
      for (let i = 0; i < 10; i++) {
        const x = rand() * TW, y = 30 + rand() * 54, r = 2 + rand() * 4;
        tileWrap(x, r, cx => { ctx.beginPath(); ctx.ellipse(cx, y, r * 1.3, r, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fill(); ctx.beginPath(); ctx.ellipse(cx - 0.6, y - 0.8, r * 0.9, r * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fill(); });
      }
      ctx.fillStyle = lin(ctx, 0, 0, 0, 22, [[0, g.topLight], [1, g.top]]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TW, 0); ctx.lineTo(TW, 16);
      for (let x = TW; x >= 0; x -= 8) ctx.lineTo(x, 16 + ((x / 8) % 2 ? 6 : 0));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = g.style === 'sand' ? 'rgba(255,255,255,0.5)' : g.topLight; ctx.lineWidth = 1.6;
      for (let x = 3; x < TW; x += 6) { ctx.beginPath(); ctx.moveTo(x, 6); ctx.lineTo(x + (x % 12 ? 2 : -2), 0); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(0, 0, TW, 2.5);
      if (g.style === 'grass') {
        for (const [x, c] of [[24, g.accent], [86, '#ffffff']] as const) { for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(ctx, x + Math.cos(a) * 2.6, 8 + Math.sin(a) * 2.6, 2); ctx.fillStyle = c; ctx.fill(); } circle(ctx, x, 8, 1.4); ctx.fillStyle = '#ffe066'; ctx.fill(); }
      }
      break;
    }
    case 'tiles': {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 2; col++) {
          const x = col * 64 + (row % 2 ? 32 : 0), y = 18 + row * 24;
          tileWrap(x + 32, 34, cx => {
            roundRect(ctx, cx - 30, y + 2, 60, 20, 4);
            ctx.fillStyle = lin(ctx, 0, y, 0, y + 22, [[0, 'rgba(255,255,255,0.22)'], [1, 'rgba(0,0,0,0.12)']]); ctx.fill();
          });
        }
      }
      ctx.fillStyle = lin(ctx, 0, 0, 0, 18, [[0, g.topLight], [1, g.top]]); ctx.fillRect(0, 0, TW, 16);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 16, TW, 3);
      ctx.fillStyle = g.accent; for (let x = 8; x < TW; x += 16) { circle(ctx, x, 8, 2.2); ctx.fill(); }
      break;
    }
    case 'candy': {
      const sprinkle = ['#ff7ac0', '#ffe066', '#5fdc8a', '#5fbfff', '#ffffff'];
      for (let i = 0; i < 18; i++) {
        const x = rand() * TW, y = 28 + rand() * 56, a = rand() * Math.PI;
        tileWrap(x, 4, cx => { ctx.save(); ctx.translate(cx, y); ctx.rotate(a); roundRect(ctx, -4, -1.3, 8, 2.6, 1.3); ctx.fillStyle = sprinkle[i % 5]; ctx.fill(); ctx.restore(); });
      }
      ctx.fillStyle = lin(ctx, 0, 0, 0, 26, [[0, '#ffffff'], [1, '#ffe2f2']]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TW, 0); ctx.lineTo(TW, 16);
      for (let x = TW; x >= 0; x -= 16) ctx.quadraticCurveTo(x - 8, 30, x - 16, 16);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(0, 0, TW, 3);
      break;
    }
    case 'cloud': {
      ctx.fillStyle = lin(ctx, 0, 0, 0, TH, [[0, '#ffffff'], [1, g.soilDark]]); ctx.fillRect(0, 0, TW, TH);
      for (const [x, y, r] of [[16, 40, 18], [56, 60, 22], [100, 44, 20], [80, 82, 18], [30, 84, 16]]) {
        tileWrap(x, r, cx => { circle(ctx, cx, y, r); ctx.fillStyle = rad(ctx, cx, y, r, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]); ctx.fill(); });
      }
      ctx.fillStyle = '#ffffff';
      for (let x = 0; x <= TW; x += 16) { circle(ctx, x, 6, 10); ctx.fill(); }
      break;
    }
    case 'stone': case 'cobble': {
      const sz = g.style === 'cobble' ? 20 : 30;
      for (let row = 0; row * sz < TH; row++) {
        for (let col = -1; col * sz < TW + sz; col++) {
          const x = col * sz + (row % 2 ? sz / 2 : 0) + sz / 2, y = 20 + row * sz * 0.8;
          tileWrap(x, sz, cx => {
            roundRect(ctx, cx - sz / 2 + 2, y, sz - 4, sz * 0.8 - 4, sz * 0.25);
            ctx.fillStyle = lin(ctx, 0, y, 0, y + sz * 0.8, [[0, 'rgba(255,255,255,0.28)'], [1, 'rgba(0,0,0,0.18)']]); ctx.fill();
          });
        }
      }
      ctx.fillStyle = lin(ctx, 0, 0, 0, 18, [[0, g.topLight], [1, g.top]]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TW, 0); ctx.lineTo(TW, 12);
      for (let x = TW; x >= 0; x -= 10) ctx.lineTo(x, 12 + ((x / 10) % 2 ? 5 : 0));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(0, 0, TW, 2.5);
      break;
    }
    case 'icing': {
      // Gingerbread with freckles and gumdrops under drippy white icing snow.
      for (let i = 0; i < 26; i++) {
        const x = rand() * TW, y = 26 + rand() * 60;
        tileWrap(x, 2, cx => { circle(ctx, cx, y, 1 + rand() * 0.8); ctx.fillStyle = 'rgba(90,40,10,0.35)'; ctx.fill(); });
      }
      for (const [x, y, col] of [[20, 52, '#e8394d'], [70, 72, '#2fa65a'], [104, 44, '#ffffff'], [44, 80, '#ffd84d']] as const) {
        roundRect(ctx, x - 4, y - 3, 8, 6, 3); ctx.fillStyle = col; ctx.fill();
        roundRect(ctx, x - 2.5, y - 2, 3, 1.5, 0.7); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
      }
      const drips = [10, 4, 13, 6, 9, 3, 12, 5];
      ctx.fillStyle = 'rgba(120,140,200,0.35)';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TW, 0); ctx.lineTo(TW, 16);
      for (let k = drips.length - 1; k >= 0; k--) { const x = k * 16 + 8; ctx.quadraticCurveTo(x + 8, 16, x + 5, 16 + drips[k]); ctx.arc(x, 16 + drips[k], 5, 0, Math.PI); ctx.quadraticCurveTo(x - 8, 16, x - 8, 16); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = lin(ctx, 0, 0, 0, 30, [[0, '#ffffff'], [1, '#eef2ff']]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(TW, 0); ctx.lineTo(TW, 13);
      for (let k = drips.length - 1; k >= 0; k--) { const x = k * 16 + 8; ctx.quadraticCurveTo(x + 8, 13, x + 5, 13 + drips[k]); ctx.arc(x, 13 + drips[k], 5, 0, Math.PI); ctx.quadraticCurveTo(x - 8, 13, x - 8, 13); }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffffff';
      for (let x = 4; x < TW; x += 11) { circle(ctx, x, 2 + (x % 3), 1.1); ctx.fillStyle = x % 2 ? '#d8e4ff' : '#ffffff'; ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(0, 0, TW, 2.5);
      break;
    }
  }
}

/** Foreground strip (960×70), drawn in front of the ground with stronger parallax. */
function paintForeground(ctx: Ctx, t: Theme): void {
  const H = 70;
  const rand = rng(t.foreground.length * 53 + t.painter.length);
  for (let i = 0; i < 15; i++) {
    const x = (i + rand() * 0.8) * (W / 15), s = 0.45 + rand() * 0.45;
    wrap(x, 40 * s, cx => {
      switch (t.foreground) {
        case 'grass': case 'flowers': {
          ctx.fillStyle = lin(ctx, 0, H - 40 * s, 0, H, [[0, t.ground.topLight], [1, t.ground.top]]);
          ctx.beginPath(); ctx.moveTo(cx - 22 * s, H);
          for (let k = 0; k < 7; k++) { const bx = cx - 22 * s + k * 7 * s; ctx.quadraticCurveTo(bx + 2 * s, H - 26 * s - (k % 3) * 8 * s, bx + 5 * s, H - 34 * s - (k % 2) * 6 * s); ctx.quadraticCurveTo(bx + 5 * s, H - 14 * s, bx + 7 * s, H); }
          ctx.closePath(); ctx.fill();
          if (t.foreground === 'flowers' && i % 3 === 0) {
            const fy = H - 36 * s, col = ['#ff7ac0', '#ffe066', '#b48aff', '#ffffff'][i % 4];
            for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(ctx, cx + Math.cos(a) * 4 * s, fy + Math.sin(a) * 4 * s, 3.2 * s); ctx.fillStyle = col; ctx.fill(); }
            circle(ctx, cx, fy, 2.2 * s); ctx.fillStyle = '#ffb347'; ctx.fill();
          }
          break;
        }
        case 'candy': {
          const col = ['#ff9fd2', '#9fe0ff', '#ffe680', '#c8b0ff'][i % 4];
          circle(ctx, cx, H - 12 * s, 12 * s); ctx.fillStyle = rad(ctx, cx, H - 12 * s, 12 * s, [[0, '#ffffff'], [0.4, col], [1, col]], cx - 4 * s, H - 16 * s); ctx.fill();
          break;
        }
        case 'cloud': {
          circle(ctx, cx, H - 4, 22 * s); ctx.fillStyle = rad(ctx, cx, H - 8, 22 * s, [[0, '#ffffff'], [1, 'rgba(225,236,252,0.95)']]); ctx.fill();
          break;
        }
        case 'pebbles': {
          ctx.beginPath(); ctx.ellipse(cx, H - 6 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2);
          ctx.fillStyle = rad(ctx, cx, H - 8 * s, 10 * s, [[0, '#ffffff'], [0.4, t.ground.topLight], [1, t.ground.soil]], cx - 3 * s, H - 9 * s); ctx.fill();
          break;
        }
        case 'glow': {
          ctx.fillStyle = t.ground.top; ctx.beginPath(); ctx.moveTo(cx - 12 * s, H); ctx.quadraticCurveTo(cx - 4 * s, H - 30 * s, cx, H - 36 * s); ctx.quadraticCurveTo(cx + 4 * s, H - 30 * s, cx + 12 * s, H); ctx.closePath(); ctx.fill();
          if (i % 2 === 0) {
            softShadow(ctx, 10, 0, 'rgba(255,190,250,0.95)');
            circle(ctx, cx, H - 38 * s, 3.5 * s); ctx.fillStyle = t.ground.accent; ctx.fill(); noShadow(ctx);
          }
          break;
        }
        case 'snow': {
          if (i % 4 === 1) {
            // A little candy cane poking out of the drift.
            ctx.save(); ctx.lineCap = 'butt';
            ctx.beginPath(); ctx.moveTo(cx + 4 * s, H); ctx.lineTo(cx + 4 * s, H - 38 * s); ctx.arc(cx - 3 * s, H - 38 * s, 7 * s, 0, Math.PI, true);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5 * s; ctx.stroke();
            ctx.setLineDash([4 * s, 4 * s]); ctx.strokeStyle = '#e8394d'; ctx.stroke(); ctx.restore();
          }
          for (const [dx, r] of [[-14, 12], [0, 17], [15, 11]]) {
            circle(ctx, cx + dx * s, H - 2, r * s);
            ctx.fillStyle = rad(ctx, cx + dx * s, H - 6 * s, r * s, [[0, '#ffffff'], [0.7, '#f2f5ff'], [1, '#c8d2f0']], cx + dx * s - 3 * s, H - 10 * s); ctx.fill();
          }
          if (i % 3 === 0) {
            // Holly sprig on top.
            ctx.fillStyle = '#2f9a4a';
            for (const dir of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + dir * 6 * s, H - 17 * s, 7 * s, 3 * s, dir * 0.4, 0, Math.PI * 2); ctx.fill(); }
            for (const [dx, dy] of [[-2, -18], [2, -18], [0, -21]]) { circle(ctx, cx + dx * s, H + dy * s, 2.4 * s); ctx.fillStyle = '#e8394d'; ctx.fill(); }
          }
          break;
        }
      }
    });
  }
}

export interface ThemeArt { far: string; mid: string; ground: string; fg: string }

export function ensureThemeArt(scene: Phaser.Scene, key: ThemeKey): ThemeArt {
  const t = THEMES[key];
  const far = `bg-far-${key}`, mid = `bg-mid-${key}`, ground = `ground-${key}`, fg = `bg-fg-${key}`;
  // Free other themes' large backgrounds and props (older iPads have little GPU memory).
  for (const other of Object.keys(THEMES)) {
    if (other === key) continue;
    for (const k of [`bg-far-${other}`, `bg-mid-${other}`, `bg-fg-${other}`]) if (scene.textures.exists(k)) scene.textures.remove(k);
  }
  freeThemeProps(scene, key);
  if (key === 'christmas') ensureChristmasArt(scene); else freeChristmasArt(scene);
  // Taller screens: the far backdrop is EXTRA_HEIGHT taller, with the extra sky at the top.
  makeTexture(scene, far, 960, 540 + EXTRA_HEIGHT, ctx => { ctx.translate(0, EXTRA_HEIGHT); paintFar(ctx, t, EXTRA_HEIGHT); });
  makeTexture(scene, mid, 960, 260, ctx => paintMid(ctx, t));
  makeTexture(scene, ground, 128, 90, ctx => paintGround(ctx, t), true);
  makeTexture(scene, fg, 960, 70, ctx => paintForeground(ctx, t));
  return { far, mid, ground, fg };
}

/**
 * A screen-fixed parallax layer made of two copies of a 960px-wide image that
 * leapfrog as the camera scrolls (keeps hi-res art sharp on every device).
 */
export class ParallaxLayer {
  private readonly parts: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene, key: string, centerY: number, depth: number) {
    this.parts = [0, 1].map(() => scene.add.image(0, centerY, key).setScrollFactor(0).setDepth(depth).setOrigin(0, 0.5));
    this.set(0);
  }

  /** Offset in logical pixels the layer has scrolled. */
  set(offset: number): void {
    const x = -(((offset % 960) + 960) % 960);
    this.parts[0].x = Math.round(x * RES) / RES;
    this.parts[1].x = this.parts[0].x + 960;
  }
}

/** World-space ground strip: a TileSprite over a raw RES× texture. */
export function addGround(scene: Phaser.Scene, key: string, centerX: number, centerY: number, width: number): Phaser.GameObjects.TileSprite {
  return scene.add.tileSprite(centerX, centerY, width, 90, key).setTileScale(1 / RES, 1 / RES);
}
