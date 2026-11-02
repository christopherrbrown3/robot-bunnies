/**
 * The spelling interaction (FINAL_SPEC §2–§3): one presentation of one word.
 *
 *   LISTEN → BUILD_WORD_WITH_TILES
 *     ├─ CORRECT   → record independent/assisted → reward → resolve
 *     ├─ INCORRECT → show full correct spelling → STUDY → hide → RETRY
 *     ├─ HINT/PEEK → mark assisted for this presentation → keep trying
 *     └─ SKIP      → mark needs review → resolve without penalty
 *
 * Child input is a full a–z tile bank (letters reusable, never only the
 * answer's letters). The physical keyboard works as an adult/dev fallback, but
 * no text box is shown and the iPad keyboard never opens.
 */
import { normalizeAnswer, recordSpellingOutcome } from '../spelling/store';
import { hearWord, stopWordAudio } from '../audio/wordAudio';
import { play } from '../audio/sfx';

export type SpellResult = 'independent' | 'assisted' | 'skipped' | 'left';

export interface SpellPrompt {
  word: string;
  /** Source week of the word; results are recorded against it. */
  weekId: string;
  /** Short story heading, e.g. "Unlock the cage!" */
  title: string;
  /** One-line story context shown above the tools. */
  story: string;
  /** Small badge, e.g. "This week's word" or "Bonus review from an earlier week". */
  badge: string;
  /** Shown after a correct answer, e.g. "The cage door swings open!" */
  successLine: string;
  /** Non-letter keys to include in the bank (from all saved lists), e.g. [" ", "'", "-"]. */
  punctuation: string[];
  /** Called the moment the prompt is resolved (correct or skip), BEFORE the celebration. */
  onResolved?: (result: Exclude<SpellResult, 'left'>) => void;
  /** Label for leaving mid-prompt; omit to hide the button. */
  leaveLabel?: string;
}

type PanelState = 'build' | 'peek' | 'study' | 'done';

const ROWS = ['abcdefghi', 'jklmnopqr', 'stuvwxyz'];
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

let panel: HTMLElement | null = null;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function displayChar(ch: string): string {
  return ch === ' ' ? '␣' : ch;
}

/** Positions in `target` that are NOT part of a longest common subsequence with `attempt`. */
export function missedPositions(target: string, attempt: string): Set<number> {
  const n = target.length, m = attempt.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = target[i] === attempt[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const kept = new Set<number>();
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (target[i] === attempt[j]) { kept.add(i); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const missed = new Set<number>();
  for (let k = 0; k < n; k++) if (!kept.has(k)) missed.add(k);
  return missed;
}

function build(): HTMLElement {
  const root = el('section', 'game-overlay spell-overlay');
  root.id = 'spell-panel';
  root.hidden = true;
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-label', 'Spelling challenge');
  root.innerHTML = `
    <div class="spell-scroll">
      <div class="spell-card">
        <header class="spell-head">
          <div class="spell-context">
            <span class="spell-badge" id="sp-badge"></span>
            <h2 id="sp-title"></h2>
          </div>
          <button type="button" class="sp-small" id="sp-leave">⏸ Pause</button>
        </header>
        <p class="spell-story" id="sp-story"></p>
        <div class="spell-tools">
          <button type="button" class="sp-hear" id="sp-hear">🔊 Hear word</button>
          <button type="button" class="sp-tool" id="sp-peek">👀 Peek</button>
          <button type="button" class="sp-tool" id="sp-hint">💡 Hint</button>
        </div>
        <div class="sp-reveal" id="sp-reveal" hidden aria-live="polite"></div>
        <div class="sp-slots" id="sp-slots" role="group" aria-label="Your spelling. Tap a letter to take it out."></div>
        <div class="sp-feedback" id="sp-feedback" role="status" aria-live="polite"></div>
        <div class="sp-bank" id="sp-bank" role="group" aria-label="Letter tiles"></div>
        <div class="sp-actions" id="sp-build-actions">
          <button type="button" class="sp-action" id="sp-back" aria-label="Back: remove the last letter">⌫ Back</button>
          <button type="button" class="sp-action" id="sp-clear">Clear</button>
          <button type="button" class="sp-action sp-primary" id="sp-check">✓ Check</button>
          <button type="button" class="sp-action sp-quiet" id="sp-skip">Skip for now</button>
        </div>
        <div class="sp-actions" id="sp-study-actions" hidden>
          <button type="button" class="sp-action sp-primary" id="sp-retry">I'm ready — hide it &amp; try again</button>
          <button type="button" class="sp-action" id="sp-study-hint">💡 Try with a hint</button>
          <button type="button" class="sp-action sp-quiet" id="sp-study-skip">Skip for now</button>
        </div>
        <div class="sp-actions" id="sp-done-actions" hidden>
          <button type="button" class="sp-action sp-primary sp-big" id="sp-continue">Continue ▶</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

/**
 * Present one word. Resolves when the child continues after a result, or
 * immediately with 'left' if they pause out of the prompt (nothing resolved).
 */
export function presentSpelling(prompt: SpellPrompt): Promise<SpellResult> {
  panel ??= build();
  const root = panel;
  const $ = <T extends HTMLElement>(id: string): T => {
    const found = root.querySelector<T>(`#${id}`);
    if (!found) throw new Error(`Spelling panel missing #${id}`);
    return found;
  };

  const target = normalizeAnswer(prompt.word);
  const slotsEl = $<HTMLDivElement>('sp-slots');
  const bankEl = $<HTMLDivElement>('sp-bank');
  const feedback = $<HTMLDivElement>('sp-feedback');
  const reveal = $<HTMLDivElement>('sp-reveal');
  const peekBtn = $<HTMLButtonElement>('sp-peek');
  const hintBtn = $<HTMLButtonElement>('sp-hint');
  const hearBtn = $<HTMLButtonElement>('sp-hear');
  const leaveBtn = $<HTMLButtonElement>('sp-leave');
  const groups = {
    build: $<HTMLDivElement>('sp-build-actions'),
    study: $<HTMLDivElement>('sp-study-actions'),
    done: $<HTMLDivElement>('sp-done-actions')
  };

  $<HTMLElement>('sp-badge').textContent = prompt.badge;
  $<HTMLElement>('sp-title').textContent = prompt.title;
  $<HTMLElement>('sp-story').textContent = prompt.story;
  leaveBtn.hidden = !prompt.leaveLabel;
  leaveBtn.textContent = prompt.leaveLabel ?? '';

  let answer: Array<string | null> = Array(target.length).fill(null);
  let cursor = 0;
  let state: PanelState = 'build';
  let hadMiss = false;
  let hadHelp = false;
  let lastAttempt = '';
  let glowLetter: string | null = null;
  let resolved = false;
  let finalResult: Exclude<SpellResult, 'left'> = 'skipped';
  let hearing = false;

  return new Promise<SpellResult>(resolvePromise => {
    const listeners: Array<() => void> = [];
    const on = (node: HTMLElement | Document, type: string, fn: (e: Event) => void): void => {
      node.addEventListener(type, fn);
      listeners.push(() => node.removeEventListener(type, fn));
    };

    const finish = (result: SpellResult): void => {
      listeners.forEach(off => off());
      stopWordAudio();
      root.hidden = true;
      resolvePromise(result);
    };

    const setFeedback = (text: string, tone: 'good' | 'error' | 'hint' | '' = ''): void => {
      feedback.textContent = text;
      feedback.className = `sp-feedback${tone ? ` sp-${tone}` : ''}`;
    };

    const firstEmpty = (): number => {
      const i = answer.indexOf(null);
      return i === -1 ? answer.length : i;
    };

    const renderSlots = (celebrate = false): void => {
      slotsEl.replaceChildren();
      answer.forEach((ch, i) => {
        const slot = el('button', 'sp-slot');
        slot.type = 'button';
        if (ch !== null) {
          slot.textContent = displayChar(ch);
          slot.classList.add('filled');
          slot.setAttribute('aria-label', `Letter ${i + 1}: ${ch === ' ' ? 'space' : ch}. Tap to take it out.`);
        } else {
          slot.setAttribute('aria-label', `Empty space ${i + 1}`);
        }
        if (state === 'build' && i === cursor && cursor < answer.length) slot.classList.add('cursor');
        if (celebrate) {
          slot.classList.add('correct');
          slot.style.animationDelay = `${i * 60}ms`;
        }
        slot.disabled = state !== 'build';
        slot.addEventListener('click', () => tapSlot(i));
        slotsEl.append(slot);
      });
      slotsEl.classList.toggle('long-word', answer.length > 9);
      slotsEl.classList.toggle('very-long-word', answer.length > 13);
    };

    const renderBank = (): void => {
      bankEl.replaceChildren();
      const rows = ROWS.map(r => r.split(''));
      const extras = prompt.punctuation.filter(ch => ch === ' ' || ch === "'" || ch === '-');
      rows[2].push(...extras);
      for (const row of rows) {
        const rowEl = el('div', 'sp-row');
        for (const ch of row) {
          const tile = el('button', 'sp-tile');
          tile.type = 'button';
          tile.dataset.letter = ch;
          tile.textContent = ch === ' ' ? 'space' : ch;
          if (ch === ' ') tile.classList.add('wide');
          if (VOWELS.has(ch)) tile.classList.add('vowel');
          if (glowLetter === ch) tile.classList.add('glow');
          tile.setAttribute('aria-label', ch === ' ' ? 'space' : ch === "'" ? 'apostrophe' : ch === '-' ? 'hyphen' : `letter ${ch}`);
          tile.disabled = state !== 'build';
          tile.addEventListener('click', () => addLetter(ch));
          rowEl.append(tile);
        }
        bankEl.append(rowEl);
      }
      bankEl.classList.toggle('dimmed', state !== 'build');
    };

    const renderRevealWord = (title: string, attempt?: string): void => {
      reveal.replaceChildren();
      reveal.append(el('div', 'sp-reveal-title', title));
      const word = el('div', 'sp-reveal-word');
      const missed = attempt !== undefined ? missedPositions(target, attempt) : new Set<number>();
      [...target].forEach((ch, i) => {
        const letter = el('span', 'sp-reveal-letter', displayChar(ch));
        if (missed.has(i)) letter.classList.add('focus');
        word.append(letter);
      });
      reveal.append(word);
      if (attempt !== undefined) {
        const yours = el('div', 'sp-reveal-attempt');
        yours.append(el('span', '', 'You tried: '), el('strong', '', attempt.replace(/ /g, '␣')));
        reveal.append(yours);
        if (missed.size) reveal.append(el('div', 'sp-reveal-tip', 'Look at the glowing letters.'));
      }
      reveal.hidden = false;
    };

    const setState = (next: PanelState): void => {
      state = next;
      groups.build.hidden = next !== 'build' && next !== 'peek';
      groups.study.hidden = next !== 'study';
      groups.done.hidden = next !== 'done';
      peekBtn.disabled = next === 'study' || next === 'done';
      hintBtn.disabled = next !== 'build';
      peekBtn.textContent = next === 'peek' ? '🙈 Hide word' : '👀 Peek';
      for (const id of ['sp-back', 'sp-clear', 'sp-check', 'sp-skip']) {
        $<HTMLButtonElement>(id).disabled = next === 'peek' && id !== 'sp-skip';
      }
      if (next === 'build') reveal.hidden = true;
      renderSlots();
      renderBank();
    };

    function addLetter(ch: string): void {
      if (state !== 'build') return;
      if (cursor >= answer.length) {
        setFeedback('All the spaces are full. Tap Check, or tap a letter to take it out.', 'hint');
        return;
      }
      play('tile');
      answer[cursor] = ch;
      glowLetter = null;
      cursor = firstEmpty();
      setFeedback('');
      renderSlots();
      renderBank();
    }

    function tapSlot(i: number): void {
      if (state !== 'build') return;
      if (answer[i] !== null) {
        play('tap');
        answer[i] = null;
      }
      cursor = i;
      renderSlots();
    }

    function backspace(): void {
      if (state !== 'build') return;
      let last = -1;
      answer.forEach((ch, i) => { if (ch !== null) last = i; });
      if (last < 0) return;
      play('tap');
      answer[last] = null;
      cursor = firstEmpty();
      renderSlots();
    }

    function clearAll(): void {
      if (state !== 'build') return;
      answer = Array(target.length).fill(null);
      cursor = 0;
      renderSlots();
    }

    async function hear(): Promise<void> {
      if (hearing) return;
      hearing = true;
      hearBtn.classList.add('playing');
      hearBtn.textContent = '🔊 Listening…';
      const via = await hearWord(prompt.word);
      hearing = false;
      hearBtn.classList.remove('playing');
      hearBtn.textContent = '🔊 Hear word';
      if (via === 'none' && !resolved) {
        setFeedback("The sound isn't working right now. Tap 👀 Peek to look at the word, hide it, then spell it from memory.", 'hint');
        peekBtn.classList.add('pulse');
      }
    }

    function togglePeek(): void {
      if (state === 'build') {
        hadHelp = true;
        peekBtn.classList.remove('pulse');
        renderRevealWord('Peek! Look closely, then hide it:');
        setState('peek');
        reveal.hidden = false;
        setFeedback('Take as long as you need. Tap 🙈 Hide word when you are ready.', 'hint');
      } else if (state === 'peek') {
        setState('build');
        setFeedback('Now spell it from memory!', 'hint');
      }
    }

    function hint(): void {
      if (state !== 'build') return;
      hadHelp = true;
      // Keep the correct beginning, send wrong letters back, and glow the next letter.
      let prefix = 0;
      while (prefix < target.length && answer[prefix] === target[prefix]) prefix++;
      if (prefix >= target.length) {
        setFeedback('Every letter is in place. Tap ✓ Check!', 'hint');
        return;
      }
      for (let i = prefix; i < answer.length; i++) answer[i] = null;
      cursor = prefix;
      glowLetter = target[prefix];
      const label = glowLetter === ' ' ? 'a space' : glowLetter === "'" ? 'an apostrophe' : glowLetter === '-' ? 'a hyphen' : `"${glowLetter}"`;
      setFeedback(prefix === 0
        ? `Hint: it starts with ${label}. The tile is glowing!`
        : `Hint: the next one is ${label}. The tile is glowing!`, 'hint');
      renderSlots();
      renderBank();
    }

    function resolve(result: Exclude<SpellResult, 'left'>): void {
      if (resolved) return;
      resolved = true;
      finalResult = result;
      try { prompt.onResolved?.(result); } catch (error) { console.error(error); }
    }

    function check(): void {
      if (state !== 'build') return;
      if (answer.includes(null)) {
        setFeedback('Fill every space first. You can tap 🔊 Hear word again!', 'hint');
        return;
      }
      const attempt = answer.join('');
      const correct = normalizeAnswer(attempt) === target;
      const independent = correct && !hadMiss && !hadHelp;
      try {
        recordSpellingOutcome(prompt.weekId, prompt.word, correct ? (independent ? 'independent-correct' : 'assisted-correct') : 'miss');
      } catch (error) { console.error(error); }
      if (correct) {
        resolve(independent ? 'independent' : 'assisted');
        play('correct');
        setState('done');
        renderSlots(true);
        setFeedback(independent
          ? `Amazing! You spelled “${prompt.word}” all by yourself! ${prompt.successLine}`
          : `You did it! “${prompt.word}” is spelled right. ${prompt.successLine}`, 'good');
        $<HTMLButtonElement>('sp-continue').focus();
      } else {
        hadMiss = true;
        lastAttempt = attempt;
        play('gentle');
        setState('study');
        renderRevealWord('Here is how to spell it:', lastAttempt);
        setFeedback('Almost! Look at the word as long as you like. When you are ready, it will hide and you can try again.', 'error');
      }
    }

    function retry(withHint = false): void {
      if (state !== 'study') return;
      answer = Array(target.length).fill(null);
      cursor = 0;
      setState('build');
      setFeedback('Your turn! Spell it from memory.', 'hint');
      if (withHint) hint();
    }

    function skip(): void {
      if (state === 'done') return;
      try { recordSpellingOutcome(prompt.weekId, prompt.word, 'skip'); } catch (error) { console.error(error); }
      resolve('skipped');
      setState('done');
      renderRevealWord('Here is the word for next time:');
      setFeedback('That is okay! This word will come back later for more practice. 🌸', 'hint');
      $<HTMLButtonElement>('sp-continue').focus();
    }

    function keydown(event: Event): void {
      const e = event as KeyboardEvent;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (state === 'build' && /^[a-z]$/.test(key)) { addLetter(key); e.preventDefault(); }
      else if (state === 'build' && (key === "'" || key === '-' || key === ' ') &&
               prompt.punctuation.includes(key)) { addLetter(key); e.preventDefault(); }
      else if (key === 'Backspace') { backspace(); e.preventDefault(); }
      else if (key === 'Enter') {
        e.preventDefault();
        if (state === 'build') check();
        else if (state === 'study') retry();
        else if (state === 'done') finish(resultOf());
      }
    }

    const resultOf = (): SpellResult => finalResult;

    on(hearBtn, 'click', () => { void hear(); });
    on(peekBtn, 'click', togglePeek);
    on(hintBtn, 'click', hint);
    on($('sp-back'), 'click', backspace);
    on($('sp-clear'), 'click', clearAll);
    on($('sp-check'), 'click', check);
    on($('sp-skip'), 'click', skip);
    on($('sp-retry'), 'click', () => retry(false));
    on($('sp-study-hint'), 'click', () => { hadHelp = true; retry(true); });
    on($('sp-study-skip'), 'click', skip);
    on($('sp-continue'), 'click', () => finish(resultOf()));
    on(leaveBtn, 'click', () => {
      if (resolved) finish(resultOf());
      else finish('left');
    });
    on(document, 'keydown', keydown);

    setFeedback('Listen, then tap the letters to spell the word.');
    root.hidden = false;
    setState('build');
    window.setTimeout(() => { if (!root.hidden && !resolved) void hear(); }, 450);
  });
}
