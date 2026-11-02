import {
  activateWeek, eraseSpellingData, exportSpellingBackup,
  importSpellingBackup, loadSpellingData, parseWords, saveWeek
} from '../spelling/store';
import type { SpellingData, SpellingWeek } from '../spelling/store';
import { reviewCount } from '../spelling/scheduler';

const eventParent = 'robot-bunnies:open-parent';
const eventPractice = 'robot-bunnies:open-spelling';

/**
 * A grown-up check separates editing from play. It is intentionally NOT
 * authentication; there is no server, account, secret, or security claim.
 */
export function initializeParentCorner(): void {
  const overlay = document.createElement('section');
  overlay.id = 'parent-corner';
  overlay.className = 'game-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Parent Corner — weekly spelling words');
  overlay.innerHTML = `
    <div class="parent-scroll">
      <div class="panel parent-panel">
        <header class="panel-header">
          <div><span class="eyebrow">GROWN-UP AREA</span><h1>Parent Corner 🌸</h1></div>
          <button type="button" class="outline-btn" id="parent-close">Back to game</button>
        </header>
        <div id="parent-gate">
          <p>Zoey's spelling words and practice history stay on this iPad.</p>
          <label for="adult-answer">Grown-up check: What is 12 × 7?</label>
          <div class="input-row">
            <input id="adult-answer" type="number" inputmode="numeric" autocomplete="off" />
            <button type="button" id="adult-unlock" class="purple-btn">Open</button>
          </div>
          <p id="gate-error" class="error-text" role="status"></p>
          <p class="small-note">This is a child-friendly barrier, not a password or security feature.</p>
        </div>
        <div id="parent-editor" hidden>
          <p class="subhead">Add up to 20 school spelling words. One word per line, or separate with commas. Keep prior weeks for extra review flowers during each full adventure.</p>
          <div class="parent-grid">
            <div class="parent-fields">
              <label for="week-picker">Saved weeks</label>
              <select id="week-picker"></select>
              <label for="week-name">Week name</label>
              <input id="week-name" maxlength="60" placeholder="Week of November 2" />
              <label for="week-words">School spelling list <span id="word-counter">0 / 20</span></label>
              <textarea id="week-words" spellcheck="false" rows="9" placeholder="hop&#10;ship&#10;bright"></textarea>
              <div class="action-row">
                <button type="button" class="purple-btn" id="week-save">Save &amp; make active</button>
                <button type="button" class="outline-btn" id="week-new">New week</button>
              </div>
              <p id="parent-message" role="status" class="status-text"></p>
            </div>
            <div class="parent-progress">
              <h2>Practice review</h2>
              <p id="week-summary" class="small-note">Add words to begin.</p>
              <ul id="week-stats" aria-label="Word practice progress"></ul>
              <div class="action-row">
                <button type="button" class="purple-btn" id="start-practice">Play 22-level adventure</button>
                <button type="button" class="outline-btn" id="start-review">Practice tricky words</button>
                <button type="button" class="outline-btn" id="start-test">Full spelling test</button>
              </div>
            </div>
          </div>
          <details class="backup-tools">
            <summary>Back up, restore or erase spelling lists</summary>
            <p>Progress is stored in this browser, not synced between iPads. Save a backup file before clearing Safari data or changing devices.</p>
            <div class="action-row">
              <button type="button" id="spelling-export" class="outline-btn">Export JSON backup</button>
              <label class="outline-btn upload-label" for="spelling-import">Import JSON backup</label>
              <input type="file" accept=".json,application/json" id="spelling-import" hidden />
              <button type="button" id="spelling-erase" class="danger-btn">Erase all local lists</button>
            </div>
          </details>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const get = <T extends HTMLElement>(id: string): T => {
    const found = overlay.querySelector<T>(`#${id}`);
    if (!found) throw new Error(`Parent Corner missing ${id}`);
    return found;
  };
  const gate = get<HTMLDivElement>('parent-gate');
  const editor = get<HTMLDivElement>('parent-editor');
  const answer = get<HTMLInputElement>('adult-answer');
  const gateError = get<HTMLParagraphElement>('gate-error');
  const message = get<HTMLParagraphElement>('parent-message');
  const weekName = get<HTMLInputElement>('week-name');
  const wordsInput = get<HTMLTextAreaElement>('week-words');
  const weekPicker = get<HTMLSelectElement>('week-picker');
  const counter = get<HTMLSpanElement>('word-counter');
  const stats = get<HTMLUListElement>('week-stats');
  const summary = get<HTMLParagraphElement>('week-summary');
  let selectedWeekId: string | undefined;

  const setMessage = (value: string, isError = false): void => {
    message.textContent = value;
    message.classList.toggle('error-text', isError);
  };

  const updateCounter = (): void => {
    const parts = wordsInput.value.split(/[,\n\r]+/).filter(x => x.trim()).length;
    counter.textContent = `${parts} / 20`;
    counter.classList.toggle('error-text', parts > 20);
  };

  function chooseWeek(week: SpellingWeek | null): void {
    selectedWeekId = week?.id;
    weekName.value = week?.label ?? `Week of ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
    wordsInput.value = week?.words.join('\n') ?? '';
    updateCounter();
    stats.replaceChildren();
    if (!week) {
      summary.textContent = 'Save a list to see progress by word.';
      return;
    }
    const practiced = week.words.filter(word => (week.progress[word]?.attempts ?? 0) > 0).length;
    summary.textContent = `${week.words.length} school words · ${practiced} practiced · ${reviewCount(week)} need another look`;
    for (const word of week.words) {
      const attempts = week.progress[word];
      const li = document.createElement('li');
      const label = document.createElement('strong');
      label.textContent = word;
      const detail = document.createElement('span');
      detail.textContent = attempts
        ? `${attempts.firstTryCorrect} first-try correct · ${attempts.misses} misses · ${attempts.assistedCorrect} helped`
        : 'Not practiced yet';
      li.append(label, detail);
      stats.append(li);
    }
  }

  function refresh(targetId?: string): void {
    let data: SpellingData;
    try {
      data = loadSpellingData();
    } catch {
      setMessage('Saved data could not be read. Import a valid backup or clear browser data to recover.', true);
      return;
    }
    weekPicker.replaceChildren();
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = 'Create a new week…';
    weekPicker.append(blank);
    for (const week of data.weeks) {
      const option = document.createElement('option');
      option.value = week.id;
      option.textContent = week.label + (week.id === data.activeWeekId ? ' (active)' : '');
      weekPicker.append(option);
    }
    const chosen = data.weeks.find(w => w.id === (targetId ?? data.activeWeekId)) ?? null;
    weekPicker.value = chosen?.id ?? '';
    chooseWeek(chosen);
  }

  function close(): void {
    overlay.hidden = true;
    gate.hidden = false;
    editor.hidden = true;
    answer.value = '';
    gateError.textContent = '';
    selectedWeekId = undefined;
  }
  function open(): void {
    overlay.hidden = false;
    gate.hidden = false;
    editor.hidden = true;
    answer.value = '';
    gateError.textContent = '';
    setMessage('');
  }
  function unlock(): void {
    if (answer.value.trim() !== '84') {
      gateError.textContent = 'Try again, grown-up!';
      return;
    }
    gate.hidden = true;
    editor.hidden = false;
    refresh();
  }

  window.addEventListener(eventParent, open);
  get<HTMLButtonElement>('parent-close').addEventListener('click', close);
  get<HTMLButtonElement>('adult-unlock').addEventListener('click', unlock);
  answer.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
  wordsInput.addEventListener('input', updateCounter);

  weekPicker.addEventListener('change', () => {
    setMessage('');
    const data = loadSpellingData();
    chooseWeek(data.weeks.find(w => w.id === weekPicker.value) ?? null);
  });
  get<HTMLButtonElement>('week-new').addEventListener('click', () => {
    weekPicker.value = '';
    chooseWeek(null);
    setMessage('New blank week. Saving makes it the active list.');
  });
  get<HTMLButtonElement>('week-save').addEventListener('click', () => {
    try {
      const week = saveWeek(weekName.value, parseWords(wordsInput.value), selectedWeekId);
      refresh(week.id);
      setMessage('Saved on this iPad! The active list will appear across all 22 levels.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save list.', true);
    }
  });

  function practice(mode: 'campaign' | 'review' | 'test'): void {
    try {
      if (!selectedWeekId) { setMessage('Save a week first.', true); return; }
      activateWeek(selectedWeekId);
      close();
      window.dispatchEvent(new CustomEvent(eventPractice, { detail: { mode } }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to load practice.', true);
    }
  }
  get<HTMLButtonElement>('start-practice').addEventListener('click', () => practice('campaign'));
  get<HTMLButtonElement>('start-review').addEventListener('click', () => practice('review'));
  get<HTMLButtonElement>('start-test').addEventListener('click', () => practice('test'));

  get<HTMLButtonElement>('spelling-export').addEventListener('click', () => {
    try {
      const blob = new Blob([exportSpellingBackup()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'robot-bunnies-spelling-backup.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage('Backup created. Save it somewhere safe before clearing this iPad.');
    } catch { setMessage('Could not create the backup.', true); }
  });
  get<HTMLInputElement>('spelling-import').addEventListener('change', async e => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('This backup is too large (1 MB limit).');
      const contents = await file.text();
      if (!window.confirm('Replace all current spelling lists and their progress with this backup?')) return;
      importSpellingBackup(contents);
      refresh();
      setMessage('Backup restored successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore backup.', true);
    } finally { input.value = ''; }
  });
  get<HTMLButtonElement>('spelling-erase').addEventListener('click', () => {
    if (!window.confirm('Permanently erase ALL spelling lists and practice history on this iPad? Export a backup first if you want to keep them.')) return;
    eraseSpellingData();
    refresh();
    setMessage('Local spelling lists and practice history erased.');
  });
}
