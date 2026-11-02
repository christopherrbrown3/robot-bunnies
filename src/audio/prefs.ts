/** Small device-local game preferences (not learning data). */
const KEY = 'robot-bunnies.prefs.v1';

export interface GamePrefs {
  sound: boolean;
  narration: boolean;
  seenCutscenes: string[];
}

const defaults = (): GamePrefs => ({ sound: true, narration: true, seenCutscenes: [] });

export function loadPrefs(): GamePrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const value = JSON.parse(raw) as Partial<GamePrefs>;
    return {
      sound: typeof value.sound === 'boolean' ? value.sound : true,
      narration: typeof value.narration === 'boolean' ? value.narration : true,
      seenCutscenes: Array.isArray(value.seenCutscenes)
        ? value.seenCutscenes.filter((x): x is string => typeof x === 'string').slice(0, 100) : []
    };
  } catch {
    return defaults();
  }
}

export function savePrefs(patch: Partial<GamePrefs>): GamePrefs {
  const next = { ...loadPrefs(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked */ }
  return next;
}

export function markCutsceneSeen(id: string): void {
  const prefs = loadPrefs();
  if (!prefs.seenCutscenes.includes(id)) savePrefs({ seenCutscenes: [...prefs.seenCutscenes, id] });
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
