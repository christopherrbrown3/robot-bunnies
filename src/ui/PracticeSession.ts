/**
 * Optional extra practice launched from Parent Corner: "tricky words" review
 * or a full-list mock spelling test. Uses the same letter-tile panel and
 * records into the same word history as the adventure.
 */
import { getActiveWeek, loadSpellingData, punctuationInLists } from '../spelling/store';
import { selectPracticeWords } from '../spelling/scheduler';
import { presentSpelling, type SpellResult } from './SpellingPanel';

export const PRACTICE_EVENT = 'robot-bunnies:open-practice';

export function initializePracticeSession(): void {
  const summary = document.createElement('section');
  summary.className = 'game-overlay';
  summary.hidden = true;
  summary.setAttribute('role', 'dialog');
  summary.setAttribute('aria-modal', 'true');
  summary.setAttribute('aria-label', 'Practice results');
  summary.innerHTML = `
    <div class="practice-scroll">
      <div class="panel quest-panel quest-finish">
        <div class="finish-art" aria-hidden="true">🐰🌸</div>
        <h2 id="practice-title">Great spelling practice!</h2>
        <p id="practice-summary"></p>
        <p id="practice-keep" class="small-note"></p>
        <div class="action-row center-actions">
          <button type="button" class="purple-btn" id="practice-again">Practice again</button>
          <button type="button" class="outline-btn" id="practice-parent">Grown-ups</button>
          <button type="button" class="outline-btn" id="practice-close">Back to game</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(summary);
  const $ = (id: string): HTMLElement => summary.querySelector<HTMLElement>(`#${id}`)!;
  let lastMode: 'review' | 'test' = 'review';
  let running = false;

  async function run(mode: 'review' | 'test'): Promise<void> {
    if (running) return;
    const week = getActiveWeek(loadSpellingData());
    if (!week?.words.length) {
      window.dispatchEvent(new Event('robot-bunnies:open-parent'));
      return;
    }
    running = true;
    lastMode = mode;
    summary.hidden = true;
    const words = selectPracticeWords(week, mode);
    const results: Array<{ word: string; result: SpellResult }> = [];
    for (let i = 0; i < words.length; i++) {
      const result = await presentSpelling({
        word: words[i],
        weekId: week.id,
        title: mode === 'test' ? `Spelling test · word ${i + 1} of ${words.length}` : `Tricky words · ${i + 1} of ${words.length}`,
        story: mode === 'test' ? 'Listen carefully, then spell the word.' : 'Practice makes these words feel easy!',
        badge: week.label,
        successLine: '🌸',
        punctuation: punctuationInLists(),
        leaveLabel: 'Stop'
      });
      if (result === 'left') break;
      results.push({ word: words[i], result });
    }
    running = false;
    const independent = results.filter(r => r.result === 'independent').length;
    $('practice-title').textContent = mode === 'test' ? 'Spelling test finished!' : 'Great spelling practice!';
    $('practice-summary').textContent = results.length
      ? `You spelled ${independent} of ${results.length} ${results.length === 1 ? 'word' : 'words'} all by yourself on the first try. Every try helps!`
      : 'No words practiced this time. That is okay!';
    const keep = results.filter(r => r.result !== 'independent').map(r => r.word);
    $('practice-keep').textContent = keep.length ? `Words to practice again: ${keep.join(', ')}` : '';
    summary.hidden = false;
    window.dispatchEvent(new Event('robot-bunnies:data-changed'));
  }

  window.addEventListener(PRACTICE_EVENT, event => {
    const mode = (event as CustomEvent<{ mode?: 'review' | 'test' }>).detail?.mode === 'test' ? 'test' : 'review';
    void run(mode);
  });
  $('practice-again').addEventListener('click', () => void run(lastMode));
  $('practice-close').addEventListener('click', () => { summary.hidden = true; });
  $('practice-parent').addEventListener('click', () => {
    summary.hidden = true;
    window.dispatchEvent(new Event('robot-bunnies:open-parent'));
  });
}
