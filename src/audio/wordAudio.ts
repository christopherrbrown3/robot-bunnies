/**
 * Hear-the-word priority (FINAL_SPEC §4):
 *   1. the parent's local recording of this exact word,
 *   2. on-device text-to-speech,
 *   3. nothing playable → caller offers Peek → Hide → Spell from memory.
 */
import { getRecording } from './recordings';
import { speak, speechAvailable, stopSpeech } from './speech';

export type HeardVia = 'recording' | 'tts' | 'none';

let player: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

function audioElement(): HTMLAudioElement {
  if (!player) {
    player = new Audio();
    player.preload = 'auto';
  }
  return player;
}

/** Prime the shared audio element from a user gesture (iPad autoplay rules). */
export function unlockWordAudio(): void {
  const el = audioElement();
  try {
    el.muted = true;
    el.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const attempt = el.play();
    if (attempt) void attempt.then(() => { el.pause(); el.muted = false; }).catch(() => { el.muted = false; });
    else el.muted = false;
  } catch { el.muted = false; }
}

export function stopWordAudio(): void {
  stopSpeech();
  if (player) {
    try { player.pause(); } catch { /* ignore */ }
  }
}

function playBlob(blob: Blob): Promise<boolean> {
  const el = audioElement();
  if (currentUrl) URL.revokeObjectURL(currentUrl);
  currentUrl = URL.createObjectURL(blob);
  el.muted = false;
  el.src = currentUrl;
  return new Promise(resolve => {
    let settled = false;
    const finish = (ok: boolean): void => { if (!settled) { settled = true; resolve(ok); } };
    el.onended = () => finish(true);
    el.onerror = () => finish(false);
    try {
      const attempt = el.play();
      if (attempt) attempt.catch(() => finish(false));
    } catch {
      finish(false);
    }
    window.setTimeout(() => finish(!el.paused || el.ended), 8000);
  });
}

/** Play a word for spelling. Never displays the word. */
export async function hearWord(word: string): Promise<HeardVia> {
  stopWordAudio();
  const recording = await getRecording(word);
  if (recording && await playBlob(recording.blob)) return 'recording';
  if (speechAvailable() && await speak(`${word}.`, 0.8)) return 'tts';
  return 'none';
}

/** Play the parent's clip directly (Parent Corner "Play"). */
export async function playRecordingFor(word: string): Promise<boolean> {
  stopWordAudio();
  const recording = await getRecording(word);
  return recording ? playBlob(recording.blob) : false;
}
