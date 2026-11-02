import {
  getActiveWeek, loadSpellingData, normalizeAnswer, recordSpellingAttempt
} from '../spelling/store';
import type { SpellingWeek } from '../spelling/store';
import {
  selectPracticeWords, type CampaignStep, type PracticeMode
} from '../spelling/scheduler';
import {
  getOrStartCampaign, markCampaignLevelComplete, type SavedCampaign
} from '../spelling/campaign';
import levels from '../content/levels.json';

const parentEvent = 'robot-bunnies:open-parent';
const practiceEvent = 'robot-bunnies:open-spelling';

export function initializeSpellingQuest(): void {
  const overlay = document.createElement('section');
  overlay.id = 'spelling-quest';
  overlay.className = 'game-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', "Lyla's 22-level spelling adventure");

  overlay.innerHTML = `
    <div class="practice-scroll">
      <div class="panel quest-panel">
        <header class="panel-header">
          <div>
            <span class="eyebrow">LYLA'S FLOWER QUEST</span>
            <h1>Spelling Adventure 🌸</h1>
          </div>
          <button type="button" class="outline-btn" id="quest-close">Save &amp; leave</button>
        </header>
        <div class="quest-topline">
          <span id="quest-week"></span>
          <span id="quest-count" aria-live="polite"></span>
        </div>
        <div class="progress-track"><div id="quest-progress"></div></div>
        <p id="quest-location" class="quest-location"></p>
        <p id="quest-source" class="small-note"></p>
        <div id="quest-card">
          <p class="quest-story" id="quest-story">Help Lyla collect flowers by spelling her secret words!</p>
          <div class="quest-hero" aria-hidden="true"><span class="hero-bunny">🐰</span><span>🌸</span><span>🌼</span><span>🌷</span><span class="hero-portal">🌀</span></div>
          <div class="quest-prompt">
            <p id="quest-instruction">Listen to the word. Then spell it!</p>
            <div id="quest-secret" class="word-secret" aria-live="polite">✿ • • •</div>
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
            <button type="button" class="purple-btn" id="quest-next" hidden>Next level →</button>
            <button type="button" class="outline-btn" id="quest-retry" hidden>Try that word again</button>
            <button type="button" class="outline-btn" id="quest-skip">Skip for now</button>
          </div>
        </div>
        <div id="quest-finish" class="quest-finish" hidden>
          <div class="finish-art" aria-hidden="true">🐰🌸🌀</div>
          <h2 id="quest-finish-title">Great job helping Lyla!</h2>
          <p id="quest-summary"></p>
          <p id="quest-finish-note">Previously tricky words return for another try in future adventures.</p>
          <div class="action-row center-actions">
            <button type="button" class="purple-btn" id="quest-again">Start a new adventure</button>
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
  const peekButton = node<HTMLButtonElement>('quest-peek');
  const secret = node<HTMLDivElement>('quest-secret');
  const instruction = node<HTMLParagraphElement>('quest-instruction');

  let currentWeek: SpellingWeek | null = null;
  let currentCampaign: SavedCampaign | null = null;
  let mode: PracticeMode = 'campaign';
  let steps: CampaignStep[] = [];
  let index = 0;
  let currentStep: CampaignStep | null = null;
  let hadMiss = false;
  let hadHelp = false;
  let wrongCount = 0;
  let firstTryCount = 0;
  let practicedCount = 0;
  let peekVisible = false;

  function showError(text: string): void {
    feedback.textContent = text;
    feedback.className = 'quest-feedback feedback-error';
  }

  function speakWord(): void {
    if (!currentStep || !('speechSynthesis' in window)) {
      showError('This iPad cannot speak the word. Peek at it, hide it, then spell from memory.');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`Spell the word: ${currentStep.word}. ${currentStep.word}.`);
      utterance.lang = 'en-US';
      utterance.rate = 0.82;
      window.speechSynthesis.speak(utterance);
      instruction.textContent = 'Listen carefully, then spell what you heard.';
    } catch {
      showError('Speech is unavailable. Use Peek, then hide the word before typing.');
    }
  }

  function hidePeek(): void {
    peekVisible = false;
    if (!currentStep) return;
    secret.textContent = '✿ ' + '• '.repeat(Math.min(currentStep.word.length, 20));
    secret.classList.remove('show-word');
    peekButton.textContent = '👀 Peek at word';
    if (!checkButton.hidden) {
      entry.disabled = false;
      checkButton.disabled = false;
    }
  }

  function togglePeek(): void {
    if (!currentStep || checkButton.hidden) return;
    hadHelp = true;
    if (peekVisible) {
      hidePeek();
      instruction.textContent = 'Now spell the word from memory!';
    } else {
      peekVisible = true;
      secret.textContent = currentStep.word;
      secret.classList.add('show-word');
      peekButton.textContent = '🙈 Hide word to spell';
      entry.disabled = true;
      checkButton.disabled = true;
      instruction.textContent = 'Study the letters, then hide the word when you are ready. No timer!';
    }
  }

  function close(): void {
    hidePeek();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    overlay.hidden = true;
    entry.blur();
  }

  function giveHint(): void {
    if (!currentStep) return;
    hadHelp = true;
    feedback.textContent = `Clue: it starts with "${currentStep.word.charAt(0).toUpperCase()}" and has ${currentStep.word.length} characters. Say the sounds slowly and try!`;
    feedback.className = 'quest-feedback feedback-hint';
  }

  function setAnswered(value: boolean): void {
    checkButton.hidden = value;
    skipButton.hidden = value;
    entry.disabled = value;
  }

  function showItem(): void {
    currentStep = steps[index] ?? null;
    if (!currentStep) { finish(); return; }
    hadMiss = false;
    hadHelp = false;
    wrongCount = 0;
    hidePeek();
    const isCampaign = mode === 'campaign';
    const level = isCampaign ? levels[currentStep.levelId - 1] : null;
    node<HTMLElement>('quest-count').textContent = isCampaign
      ? `Level ${currentStep.levelId} of 22`
      : `Word ${index + 1} of ${steps.length}`;
    node<HTMLElement>('quest-location').textContent = level ? `🏰 ${level.title}` : '';
    node<HTMLElement>('quest-source').textContent = currentStep.source === 'previous'
      ? '✨ A bonus review flower from an earlier week!'
      : isCampaign ? '🌸 A flower from this week’s spelling list' : '';
    node<HTMLElement>('quest-progress').style.width = `${(index / steps.length) * 100}%`;
    feedback.textContent = '';
    feedback.className = 'quest-feedback';
    instruction.textContent = 'Listen to the word. Then spell it without looking!';
    entry.value = '';
    entry.disabled = false;
    checkButton.hidden = false;
    checkButton.disabled = false;
    skipButton.hidden = false;
    retryButton.hidden = true;
    nextButton.hidden = true;
    node<HTMLElement>('quest-story').textContent = level
      ? `Help Lyla find her way through ${level.setting}. Spell a word to collect her flower!`
      : 'Help Lyla collect a magical flower by spelling its secret word!';
  }

  function finish(): void {
    hidePeek();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    node<HTMLDivElement>('quest-card').hidden = true;
    node<HTMLDivElement>('quest-finish').hidden = false;
    node<HTMLElement>('quest-progress').style.width = '100%';
    node<HTMLElement>('quest-count').textContent = mode === 'campaign' ? '22 / 22 levels!' : 'Practice completed!';
    node<HTMLElement>('quest-location').textContent = mode === 'campaign' ? '🌈 The final purple-and-blue portal is open!' : '';
    node<HTMLElement>('quest-source').textContent = '';
    node<HTMLElement>('quest-finish-title').textContent =
      mode === 'campaign' ? 'Lyla finished all 22 levels! 🎉' : 'Great spelling practice!';
    node<HTMLElement>('quest-summary').textContent =
      `This visit you practiced ${practicedCount} spelling ${practicedCount === 1 ? 'word' : 'prompts'}. ${firstTryCount} correct on the first try without hints. Every try helps!`;
    node<HTMLElement>('quest-finish-note').textContent = mode === 'campaign'
      ? 'You covered all of this week’s words across the adventure. You can start a fresh playthrough whenever you like.'
      : 'Practice the tricky words again when you want to.';
    node<HTMLButtonElement>('quest-again').textContent =
      mode === 'campaign' ? 'Play all 22 again' : 'Practice again';
  }

  function advance(): void {
    index += 1;
    practicedCount += 1;
    if (index < steps.length) showItem();
    else finish();
  }

  function markStage(): boolean {
    if (mode !== 'campaign' || !currentCampaign) return true;
    try {
      currentCampaign = markCampaignLevelComplete(currentCampaign, index);
      return true;
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not save this level. Return to the home screen.');
      return false;
    }
  }

  function check(): void {
    if (!currentStep || !currentWeek || peekVisible || checkButton.hidden) return;
    if (!entry.value.trim()) {
      showError('Type the word before checking. You can listen again or ask for a clue.');
      return;
    }
    const correct = normalizeAnswer(entry.value) === normalizeAnswer(currentStep.word);
    const firstTry = !hadMiss && !hadHelp;
    try {
      if (correct && !markStage()) return;
      recordSpellingAttempt(currentStep.weekId, currentStep.word, correct, firstTry, hadHelp || hadMiss);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not save spelling progress.');
      return;
    }
    if (correct) {
      if (firstTry) firstTryCount += 1;
      feedback.textContent = hadMiss
        ? `You did it! "${currentStep.word}" is spelled correctly. Lyla gets her flower! 🌸`
        : hadHelp
          ? `Nice remembering! "${currentStep.word}" is correct. A flower for Lyla! 🌸`
          : `Wonderful! "${currentStep.word}" is right on the first try! 🌸`;
      feedback.className = 'quest-feedback feedback-good';
      node<HTMLElement>('quest-story').textContent = '🌸 Lyla puts another flower in her pink fanny pack!';
      setAnswered(true);
      retryButton.hidden = true;
      nextButton.hidden = false;
    } else {
      hadMiss = true;
      wrongCount++;
      hadHelp = true;
      feedback.textContent = `The correct spelling is "${currentStep.word}". Look at the letters, then try again from memory.`;
      feedback.className = 'quest-feedback feedback-error';
      secret.textContent = currentStep.word;
      secret.classList.add('show-word');
      setAnswered(true);
      retryButton.hidden = false;
      nextButton.hidden = true;
      node<HTMLElement>('quest-story').textContent = 'Lyla can keep trying. The flower will still be here!';
    }
  }

  function retry(): void {
    retryButton.hidden = true;
    hidePeek();
    feedback.textContent = wrongCount > 1
      ? 'Try saying each sound slowly. You can peek if you need to.'
      : 'Your turn! Spell the word again.';
    feedback.className = 'quest-feedback feedback-hint';
    instruction.textContent = 'Remember the word you just saw. Type it now!';
    entry.value = '';
    setAnswered(false);
    checkButton.disabled = false;
  }

  function skip(): void {
    if (!currentStep) return;
    try {
      if (!markStage()) return;
      recordSpellingAttempt(currentStep.weekId, currentStep.word, false, false, true);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not save spelling progress.');
      return;
    }
    advance();
  }

  function start(requestedMode: PracticeMode = 'campaign'): void {
    let week: SpellingWeek | null = null;
    try { week = getActiveWeek(loadSpellingData()); } catch { /* Open parent to recover */ }
    if (!week?.words.length) {
      close();
      window.dispatchEvent(new Event(parentEvent));
      return;
    }
    currentWeek = week;
    currentCampaign = null;
    mode = requestedMode;
    if (mode === 'campaign') {
      try {
        currentCampaign = getOrStartCampaign();
        steps = currentCampaign.steps;
        index = currentCampaign.nextLevelIndex;
      } catch (error) {
        showError(error instanceof Error ? error.message : 'Could not load the adventure.');
        return;
      }
    } else {
      const selected = selectPracticeWords(week, mode);
      steps = selected.map((word, i) => ({
        levelId: i + 1, weekId: week.id, word, source: 'current'
      }));
      index = 0;
    }
    practicedCount = 0;
    firstTryCount = 0;
    node<HTMLDivElement>('quest-card').hidden = false;
    node<HTMLDivElement>('quest-finish').hidden = true;
    node<HTMLElement>('quest-week').textContent = `${week.label} · ${mode === 'campaign' ? '22-level adventure' : mode === 'test' ? 'Full spelling test' : 'Tricky words'}`;
    overlay.hidden = false;
    showItem();
  }

  window.addEventListener(practiceEvent, event => {
    const requested = (event as CustomEvent<{mode?: PracticeMode}>).detail?.mode ?? 'campaign';
    start(requested);
  });
  node<HTMLButtonElement>('quest-close').addEventListener('click', close);
  node<HTMLButtonElement>('quest-hear').addEventListener('click', speakWord);
  peekButton.addEventListener('click', togglePeek);
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
