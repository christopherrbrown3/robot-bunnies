/** Browser text-to-speech with graceful failure (FINAL_SPEC §4, step 2). */

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function';
}

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined && cachedVoice !== null) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  cachedVoice =
    voices.find(v => v.lang === 'en-US' && v.localService && /samantha|allison|ava|karen|female/i.test(v.name)) ??
    voices.find(v => v.lang === 'en-US' && v.localService) ??
    voices.find(v => v.lang === 'en-US') ??
    voices.find(v => v.lang.startsWith('en')) ?? null;
  return cachedVoice;
}

if (speechAvailable()) {
  try { window.speechSynthesis.addEventListener?.('voiceschanged', () => { cachedVoice = undefined; }); } catch { /* old Safari */ }
}

/** Prime speech from a user gesture so later automatic prompts can speak on iPad. */
export function unlockSpeech(): void {
  if (!speechAvailable()) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function stopSpeech(): void {
  if (speechAvailable()) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
}

/**
 * Speak text. Resolves true when speech started (and ended), false when TTS is
 * unavailable or errored, so callers can show the visual Peek fallback.
 */
export function speak(text: string, rate = 0.85): Promise<boolean> {
  if (!speechAvailable()) return Promise.resolve(false);
  return new Promise(resolve => {
    let started = false;
    let settled = false;
    const done = (ok: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate;
      const voice = pickVoice();
      if (voice) u.voice = voice;
      u.onstart = () => { started = true; };
      u.onend = () => done(true);
      u.onerror = () => done(started);
      window.speechSynthesis.speak(u);
      // Some Safari versions never fire events when speech is blocked or voiceless.
      window.setTimeout(() => done(started || window.speechSynthesis.speaking), 2500 + text.length * 90);
      window.setTimeout(() => { if (!started && !window.speechSynthesis.speaking) done(false); }, 1600);
    } catch {
      done(false);
    }
  });
}
