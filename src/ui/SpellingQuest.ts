import {
  getActiveWeek, loadSpellingData, normalizeAnswer, recordSpellingAttempt
} from '../spelling/store';
import type { SpellingWeek } from '../spelling/store';
import { selectPracticeWords, type PracticeMode } from '../spelling/scheduler';

const parentEvent = 'robot-bunnies:open-parent';
const practiceEvent = 'robot-bunnies:open-spelling';

export function initializeSpellingQuest(): void {
  const overlay = document.createElement('section');
  overlay.id = 'spelling-quest';
  overlay.className = 'game-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Lyla’s Spelling Quest');

  overlay.innerHTML = `
    <div class="practice-scroll">
      <div class="panel quest-panel">
        <header class="panel-header">
          <div>
            <span class="eyebrow">LYLA'S FLOWER QUEST</span>
            <h1>Spelling Adventure 🌸</h1>
          </div>
          <button type="button" class="outline-btn" id="quest-close">Leave practice</button>
        </header>
        <div class="quest-topline">
          <span id="quest-week"></span>
          <span id="quest-count" aria-live="polite"></span>
        </div>
        <div class="progress-track"><div id="quest-progress"></div></div>
        <div id="quest-card">
          <p class="quest-story" id="quest-story">Help Lyla collect magical flowers by spelling her secret words!</p>
          <div class="quest-hero" aria-hidden="true"><span class="hero-bunny">🐰</span><span class="quest-flower">🌸</span><span class="quest-flower">🌼</span><span class="quest-flower">🌷</span><span class="hero-portal">🌀</span></div>
          <div class="quest-prompt">
            <p id="quest-instruction">Listen to the word. Then spell it!</p>
            <div id="quest-secret" class="word-secret" aria-live="polite">_ _ _</div>
            <div class="action-row center-actions">
              <button type="button" class="purple-btn" id="quest-hear">🔊 Hear word</button>
              <button type="button" class="outline-btn" id="quest-peek">👀 Peek at word</button>
              <button type="button" class="outline-btn" id="quest-hint">💡 Get a clue</button>
            </div>
          </div>
          <label for="quest-answer" class="quest-label">Type the spelling</label>
          <div class="answer-row">
            <input id="quest-answer" type="text" autocomplete="off" autocapitalize="none"
              spellcheck="false" autocorrect="off" enterkeyhint="done" maxlength="40"
              aria-label="Type the spelling word" />
            <button type="button" class="purple-btn" id="quest-check">Check</button>
          </div>
          <div id="quest-feedback" class="quest-feedback" aria-live="polite" role="status"></div>
          <div class="action-row center-actions">
            <button type="button" class="purple-btn" id="quest-next" hidden>Next flower →</button>
            <button type="button" class="outline-btn" id="quest-retry" hidden>Try that word again</button>
            <button type="button" class="outline-btn" id="quest-skip">Skip this word</button>
          </div>
        </div>
        <div id="quest-finish" class="quest-finish" hidden>
          <div class="finish-art" aria-hidden="true">🐰🌸🌀</div>
          <h2>Great job helping Lyla!</h2>
          <p id="quest-summary"></p>
          <p>Some words may come back another day so they get easier to remember.</p>
          <div class="action-row center-actions">
            <button type="button" class="purple-btn" id="quest-again">Another adventure</button>
            <button type="button" class="outline-btn" id="quest-parent">Parent Corner</button>
            <button type="button" class="outline-btn" id="quest-home">Back to game</button>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const node = <T extends HTMLElement>(id: string): T => {
    const found = overlay.querySelector<T>(`#${id}`);
    if (!found) throw new Error(`Missing quest UI: ${id}`);
    return found;
  };

  const entry = node<HTMLInputElement>('quest-answer');
  const feedback = node<HTMLDivElement>('quest-feedback');
  const checkButton = node<HTMLButtonElement>('quest-check');
  const nextButton = node<HTMLButtonElement>('quest-next');
  const retryButton = node<HTMLButtonElement>('quest-retry');
  const skipButton = node<HTMLButtonElement>('quest-skip');
  const secret = node<HTMLDivElement>('quest-secret');
  const instruction = node<HTMLParagraphElement>('quest-instruction');

  let currentWeek: SpellingWeek | null = null;
  let mode: PracticeMode = 'quick';
  let words: string[] = [];
  let index = 0;
  let currentWord = '';
  let hadMiss = false;
  let hadHelp = false;
  let wrongCount = 0;
  let firstTryCount = 0;
  let practicedCount = 0;
  let peekTimeout: number | undefined;

  function showError(text: string): void {
    feedback.textContent = text;
    feedback.className = 'quest-feedback feedback-error';
  }

  function speakWord(): void {
    if (!currentWord || !('speechSynthesis' in window)) {
      showError('This iPad cannot speak the word. Tap Peek, read it, hide it, then spell from memory.');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Spell the word: ${currentWord}. ${currentWord}.`);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      window.speechSynthesis.speak(utterance);
      instruction.textContent = 'Listen carefully, then spell what you heard.';
    } catch {
      showError('Could not read this word aloud. Use Peek to study it briefly, then spell it from memory.');
    }
  }

  function hidePeek(): void {
    if (peekTimeout !== undefined) window.clearTimeout(peekTimeout);
    peekTimeout = undefined;
    secret.textContent = '✿ ' + '• '.repeat(Math.min(currentWord.length, 20));
    secret.classList.remove('show-word');
  }

  function close(): void {
    if (peekTimeout !== undefined) window.clearTimeout(peekTimeout);
    peekTimeout = undefined;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    overlay.hidden = true;
    entry.blur();
  }

  function showWord(): void {
    if (!currentWord) return;
    hadHelp = true;
    if (peekTimeout !== undefined) window.clearTimeout(peekTimeout);
    secret.textContent = currentWord;
    secret.classList.add('show-word');
    peekTimeout = window.setTimeout(() => {
      hidePeek();
      instruction.textContent = 'The word is hidden again. Can you remember how to spell it?';
    }, 3500);
    instruction.textContent = 'Look carefully! In a moment, the word will disappear.';
  }

  function giveHint(): void {
    if (!currentWord) return;
    hadHelp = true;
    const first = currentWord.charAt(0).toUpperCase();
    const length = currentWord.length;
    feedback.textContent = `Clue: it starts with "${first}" and has ${length} letters. Listen to the sounds and try!`;
    feedback.className = 'quest-feedback feedback-hint';
    instruction.textContent = 'Say the sounds slowly and think about the letters.';
  }

  function setAnswered(value: boolean): void {
    checkButton.hidden = value;
    skipButton.hidden = value;
    entry.disabled = value;
  }

  function showItem(): void {
    hidePeek();
    currentWord = words[index];
    hadMiss = false;
    hadHelp = false;
    wrongCount = 0;
    practicedCount = Math.max(practicedCount, index);
    node<HTMLElement>('quest-count').textContent = `Flower ${index + 1} of ${words.length}`;
    node<HTMLElement>('quest-progress').style.width = `${(index / words.length) * 100}%`;
    secret.textContent = '✿ ' + '• '.repeat(Math.min(currentWord.length, 20));
    feedback.textContent = '';
    feedback.className = 'quest-feedback';
    instruction.textContent = 'Listen to the word. Then spell it without looking!';
    entry.value = '';
    entry.disabled = false;
    checkButton.hidden = false;
    skipButton.hidden = false;
    retryButton.hidden = true;
    nextButton.hidden = true;
    node<HTMLElement>('quest-story').textContent = index === 0
      ? 'Lyla found a flower! Spell the secret word to put it in her pink fanny pack.'
      : 'Another magical flower is waiting! Help Lyla collect it.';
  }

  function finish(): void {
    hidePeek();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    node<HTMLDivElement>('quest-card').hidden = true;
    node<HTMLDivElement>('quest-finish').hidden = false;
    node<HTMLElement>('quest-progress').style.width = '100%';
    node<HTMLElement>('quest-count').textContent = 'Portal opened!';
    node<HTMLElement>('quest-summary').textContent =
      `You practiced ${practicedCount} word${practicedCount === 1 ? '' : 's'}! ${firstTryCount} correct without hints on the first try. Every try helps.`;
  }

  function advance(): void {
    index += 1;
    practicedCount = Math.max(practicedCount, index);
    if (index < words.length) showItem();
    else finish();
  }

  function check(): void {
    if (!currentWeek) return;
    if (!entry.value.trim()) {
      showError('Type the word before checking. You can listen again or ask for a clue.');
      return;
    }
    hidePeek();
    const correct = normalizeAnswer(entry.value) === normalizeAnswer(currentWord);
    recordSpellingAttempt(currentWeek.id, currentWord, correct, !hadMiss && !hadHelp, hadHelp || hadMiss);
    if (correct) {
      if (!hadMiss && !hadHelp) firstTryCount += 1;
      feedback.textContent = hadMiss
        ? `You did it! "${currentWord}" is spelled correctly. Lyla gets her flower! 🌸`
        : hadHelp
          ? `Nice remembering! "${currentWord}" is correct. A flower for Lyla! 🌸`
          : `Wonderful! "${currentWord}" is right on the first try! 🌸`;
      feedback.className = 'quest-feedback feedback-good';
      node<HTMLElement>('quest-story').textContent = '🌸 Lyla puts another magical flower in her pink fanny pack!';
      setAnswered(true);
      retryButton.hidden = true;
      nextButton.hidden = false;
    } else {
      hadMiss = true;
      wrongCount++;
      hadHelp = true;
      feedback.textContent = `Let's learn this one! The correct spelling is "${currentWord}". Look at each letter, then tap Try Again to spell it from memory.`;
      feedback.className = 'quest-feedback feedback-error';
      secret.textContent = currentWord;
      secret.classList.add('show-word');
      setAnswered(true);
      retryButton.hidden = false;
      nextButton.hidden = true;
      node<HTMLElement>('quest-story').textContent = 'Lyla can keep trying. The flower will still be here!';
    }
  }

  function retry(): void {
    retryButton.hidden = true;
    secret.textContent = '✿ ' + '• '.repeat(Math.min(currentWord.length, 20));
    secret.classList.remove('show-word');
    feedback.textContent = wrongCount > 1 ? 'Try saying each sound slowly. You can use Peek if you need it.' : 'Your turn! Spell the word again.';
    feedback.className = 'quest-feedback feedback-hint';
    instruction.textContent = 'Remember the word you just saw. Type it now!';
    entry.value = '';
    setAnswered(false);
  }

  function skip(): void {
    if (!currentWeek) return;
    recordSpellingAttempt(currentWeek.id, currentWord, false, false, true);
    advance();
  }

  function start(requestedMode: PracticeMode = 'quick'): void {
    let week: SpellingWeek | null = null;
    try { week = getActiveWeek(loadSpellingData()); } catch { /* Show parent recovery. */ }
    if (!week || week.words.length === 0) {
      close();
      window.dispatchEvent(new Event(parentEvent));
      return;
    }
    const selected = selectPracticeWords(week, requestedMode);
    if (selected.length === 0 && requestedMode === 'review') {
      mode = 'quick';
      words = selectPracticeWords(week, 'quick');
    } else {
      mode = requestedMode;
      words = selected;
    }
    currentWeek = week;
    index = 0;
    practicedCount = 0;
    firstTryCount = 0;
    node<HTMLDivElement>('quest-card').hidden = false;
    node<HTMLDivElement>('quest-finish').hidden = true;
    node<HTMLElement>('quest-week').textContent = `${week.label} · ${mode === 'test' ? 'Spelling test' : mode === 'review' ? 'Tricky words' : 'Quick quest'}`;
    overlay.hidden = false;
    showItem();
  }

  window.addEventListener(practiceEvent, event => {
    const requested = (event as CustomEvent<{mode?: PracticeMode}>).detail?.mode ?? 'quick';
    start(requested);
  });
  node<HTMLButtonElement>('quest-close').addEventListener('click', close);
  node<HTMLButtonElement>('quest-hear').addEventListener('click', speakWord);
  node<HTMLButtonElement>('quest-peek').addEventListener('click', showWord);
  node<HTMLButtonElement>('quest-hint').addEventListener('click', giveHint);
  checkButton.addEventListener('click', check);
  entry.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!checkButton.hidden) check();
      else if (!retryButton.hidden) retry();
      else if (!nextButton.hidden) advance();
    }
  });
  retryButton.addEventListener('click', retry);
  nextButton.addEventListener('click', advance);
  skipButton.addEventListener('click', skip);
  node<HTMLButtonElement>('quest-again').addEventListener('click', () => start(mode));
  node<HTMLButtonElement>('quest-home').addEventListener('click', close);
  node<HTMLButtonElement>('quest-parent').addEventListener('click', () => {
    close();
    window.dispatchEvent(new Event(parentEvent));
  });
}
