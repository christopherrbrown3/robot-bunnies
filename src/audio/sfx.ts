/**
 * Original synthesized sound effects (Web Audio oscillators): no licensed
 * media. Safe no-ops where Web Audio is unavailable.
 */
import { loadPrefs } from './prefs';

type Ctx = AudioContext;
let ctx: Ctx | null = null;

function context(): Ctx | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

/** Call from a user gesture: iPad Safari only starts audio after a tap. */
export function unlockAudio(): void {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => undefined);
  try {
    const buffer = c.createBuffer(1, 1, 22050);
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.connect(c.destination);
    source.start(0);
  } catch { /* ignore */ }
}

function tone(freq: number, start: number, duration: number, type: OscillatorType = 'sine', volume = 0.18, slideTo?: number): void {
  const c = context();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

export type Sfx = 'jump' | 'flower' | 'bump' | 'shrink' | 'grow' | 'tile' | 'correct' | 'gentle' |
  'portal' | 'whoosh' | 'arrow' | 'pop' | 'checkpoint' | 'bead' | 'tap';

export function play(name: Sfx): void {
  if (!loadPrefs().sound) return;
  switch (name) {
    case 'jump': tone(380, 0, 0.18, 'triangle', 0.14, 760); break;
    case 'flower': tone(988, 0, 0.09, 'sine', 0.13); tone(1319, 0.07, 0.14, 'sine', 0.12); break;
    case 'bead': tone(1568, 0, 0.06, 'sine', 0.09); tone(2093, 0.05, 0.08, 'sine', 0.07); break;
    case 'bump': tone(180, 0, 0.16, 'triangle', 0.16, 110); break;
    case 'shrink': tone(900, 0, 0.25, 'sine', 0.12, 300); break;
    case 'grow': tone(300, 0, 0.25, 'sine', 0.12, 900); break;
    case 'tile': tone(660, 0, 0.05, 'triangle', 0.08); break;
    case 'tap': tone(520, 0, 0.05, 'triangle', 0.07); break;
    case 'correct':
      [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'triangle', 0.13));
      break;
    case 'gentle': tone(440, 0, 0.18, 'sine', 0.1); tone(392, 0.16, 0.25, 'sine', 0.09); break;
    case 'portal': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.3, 'sine', 0.1)); break;
    case 'whoosh': tone(200, 0, 0.35, 'sawtooth', 0.05, 1200); break;
    case 'arrow': tone(700, 0, 0.2, 'triangle', 0.1, 1400); break;
    case 'pop': tone(600, 0, 0.08, 'square', 0.07, 1200); tone(1200, 0.06, 0.12, 'sine', 0.08); break;
    case 'checkpoint': tone(659, 0, 0.12, 'triangle', 0.1); tone(880, 0.1, 0.18, 'triangle', 0.1); break;
  }
}
