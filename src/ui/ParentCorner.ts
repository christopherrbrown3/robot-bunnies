import {
  activateWeek, eraseSpellingData, exportSpellingBackup,
  importSpellingBackup, loadSpellingData, parseWords, saveWeek
} from '../spelling/store';
import type { SpellingData, SpellingWeek } from '../spelling/store';
import { isSecure, isSecureAcrossDays, wordStatus } from '../spelling/mastery';
import { CAMPAIGN_LEVEL_COUNT, coveredCurrentWords, peekCampaign } from '../spelling/campaign';
import {
  deleteRecording, eraseRecordings, exportRecordings, importRecordings,
  listRecordedWords, recordingsSupported, saveRecording
} from '../audio/recordings';
import { playRecordingFor } from '../audio/wordAudio';
import { speak } from '../audio/speech';
import { play } from '../audio/sfx';
import { UPDATE_READY_EVENT, checkForUpdate, installUpdate, isUpdateReady, versionLabel } from '../updates';

const eventParent = 'robot-bunnies:open-parent';
const eventPractice = 'robot-bunnies:open-practice';
const eventPlay = 'robot-bunnies:play';
const eventChanged = 'robot-bunnies:data-changed';
const MAX_RECORD_MS = 5000;
/** Gap between the start tone and the microphone opening, so the tone isn't captured. */
const START_TONE_GAP_MS = 350;

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
          <div id="rec-banner" class="rec-banner" role="status" aria-live="assertive" hidden></div>
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
              <p class="small-note legend"><strong>Secure</strong> = spelled correctly on the first try, with no help, two times in a row since the last miss, hint, peek or skip. Different days are a stronger sign but never required.</p>
              <ul id="week-stats" aria-label="Word practice progress"></ul>
              <p id="record-note" class="small-note">🎙 Optional: record your own voice for any word the iPad says wrong. Recordings stay on this iPad and play instead of the robot voice.</p>
              <div class="action-row">
                <button type="button" class="purple-btn" id="start-practice">Play ${CAMPAIGN_LEVEL_COUNT}-level adventure</button>
                <button type="button" class="outline-btn" id="start-review">Practice tricky words</button>
                <button type="button" class="outline-btn" id="start-test">Full spelling test</button>
              </div>
            </div>
          </div>
          <details class="backup-tools">
            <summary>Back up, restore or erase spelling lists</summary>
            <p>Progress is stored in this browser, not synced between iPads. Save a backup file before clearing Safari data or changing devices. The word-list backup does <strong>not</strong> include voice recordings or the in-progress adventure position; recordings have their own backup file below.</p>
            <div class="action-row">
              <button type="button" id="spelling-export" class="outline-btn">Export word-list backup</button>
              <label class="outline-btn upload-label" for="spelling-import">Import word-list backup</label>
              <input type="file" accept=".json,application/json" id="spelling-import" hidden />
              <button type="button" id="spelling-erase" class="danger-btn">Erase all local lists</button>
            </div>
            <div class="action-row">
              <button type="button" id="recordings-export" class="outline-btn">Export voice recordings</button>
              <label class="outline-btn upload-label" for="recordings-import">Import voice recordings</label>
              <input type="file" accept=".json,application/json" id="recordings-import" hidden />
              <button type="button" id="recordings-erase" class="danger-btn">Erase all recordings</button>
            </div>
            <input type="file" accept="audio/*" id="recording-file" hidden />
          </details>
          <div class="update-tools">
            <h2>Game version</h2>
            <p class="small-note">Installed on this iPad: <strong id="app-version"></strong>. New versions download by themselves and wait until you choose to update, so a game in progress is never interrupted. The title screen and map also show an Update button when one is ready.</p>
            <div class="action-row">
              <button type="button" class="outline-btn" id="update-check">Check for updates</button>
              <button type="button" class="purple-btn" id="update-install" hidden>Update now</button>
            </div>
            <p id="update-status" class="status-text" role="status"></p>
          </div>
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
    renderStats(week);
  }

  function renderStats(week: SpellingWeek): void {
    stats.replaceChildren();
    const data = loadSpellingData();
    const campaign = data.activeWeekId === week.id ? peekCampaign(data) : null;
    const covered = campaign ? coveredCurrentWords(campaign).filter(w => week.words.includes(w)).length : 0;
    const secure = week.words.filter(w => isSecure(week.progress[w])).length;
    const multiDay = week.words.filter(w => isSecureAcrossDays(week.progress[w])).length;
    const needs = week.words.length - secure;
    summary.textContent = `${week.words.length} words · covered in this adventure: ${campaign ? `${covered} / ${week.words.length}` : '—'} · needs practice: ${needs} · secure: ${secure} · secure across multiple days: ${multiDay}`;
    void listRecordedWords().then(recorded => {
      for (const word of week.words) {
        const p = week.progress[word];
        const status = wordStatus(p);
        const li = document.createElement('li');
        const top = document.createElement('div');
        top.className = 'stat-top';
        const label = document.createElement('strong');
        label.textContent = word;
        const chip = document.createElement('span');
        chip.className = `chip chip-${status}`;
        chip.textContent = status === 'untested' ? 'Not tried yet'
          : status === 'secure' ? (isSecureAcrossDays(p) ? 'Secure · 2+ days' : 'Secure')
          : `Needs practice${p && p.streak === 1 ? ' · 1 of 2' : ''}`;
        top.append(label, chip);
        const detail = document.createElement('span');
        detail.className = 'stat-detail';
        detail.textContent = p && p.attempts
          ? `${p.firstTryCorrect} first-try · ${p.assistedCorrect} helped · ${p.misses} misses · ${p.skips} skipped`
          : 'Not practiced yet';
        const controls = document.createElement('div');
        controls.className = 'record-row';
        const has = recorded.has(word);
        const recordBtn = smallButton(has ? '🎙 Re-record' : '🎙 Record', () => void record(word, week.id, recordBtn, li),
          `Record your voice saying ${word}`);
        recordBtn.classList.add('rec-btn');
        controls.append(
          recordBtn,
          smallButton(has ? '▶ My voice' : '▶ iPad voice', () => void (has ? playRecordingFor(word) : speak(`${word}.`, 0.8)))
        );
        if (has) controls.append(smallButton('🗑', () => void removeRecording(word, week.id), `Delete recording for ${word}`));
        li.append(top, detail, controls);
        stats.append(li);
      }
    });
  }

  function smallButton(text: string, onClick: () => void, aria?: string): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mini-btn';
    b.textContent = text;
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', onClick);
    return b;
  }

  let recordingFor: string | null = null;
  const fileInput = get<HTMLInputElement>('recording-file');
  const recBanner = get<HTMLDivElement>('rec-banner');
  /** The recording in progress, if any. `stop` ends it early (and saves it). */
  let activeRecording: { word: string; stop: () => void } | null = null;

  function stopActiveRecording(): void {
    activeRecording?.stop();
  }

  /**
   * Record the grown-up saying `word`, with an unmistakable cue (issue #3):
   * a start tone, the row highlighted, the button turned into a pulsing red
   * "Stop" with a countdown, a live microphone level meter, a banner at the
   * top of Parent Corner, and a stop tone. Tap Stop to finish early.
   */
  async function record(word: string, weekId: string, button: HTMLButtonElement, row: HTMLLIElement): Promise<void> {
    if (activeRecording) {
      if (activeRecording.word === word) stopActiveRecording();
      return;
    }
    if (!recordingsSupported()) { setMessage('This browser cannot store recordings.', true); return; }
    const canRecord = typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
    if (!canRecord) {
      // Older iPads: choose or capture an audio file instead.
      recordingFor = word;
      fileInput.click();
      return;
    }

    // ---- the cue starts the instant Record is tapped (before the mic opens) ----
    const otherButtons = [...stats.querySelectorAll<HTMLButtonElement>('.rec-btn')].filter(b => b !== button);
    otherButtons.forEach(b => { b.disabled = true; });
    const originalLabel = button.textContent ?? '';
    row.classList.add('is-recording');
    button.classList.add('rec-stop');
    button.setAttribute('aria-label', `Stop recording ${word}`);
    button.textContent = '● Starting…';
    recBanner.hidden = false;
    recBanner.textContent = `● Opening the microphone to record “${word}”…`;
    setMessage('');

    let stream: MediaStream | null = null;
    let recorder: MediaRecorder | null = null;
    let analyserCtx: AudioContext | null = null;
    let meter: HTMLSpanElement | null = null;
    let raf = 0;
    let countdown = 0;
    let deadline = 0;
    let finished = false;
    let startedAt = 0;

    const cleanUp = (): void => {
      window.clearInterval(countdown);
      window.clearTimeout(deadline);
      window.cancelAnimationFrame(raf);
      void analyserCtx?.close().catch(() => undefined);
      stream?.getTracks().forEach(t => t.stop());
      row.classList.remove('is-recording');
      button.classList.remove('rec-stop');
      button.textContent = originalLabel;
      button.setAttribute('aria-label', `Record your voice saying ${word}`);
      otherButtons.forEach(b => { b.disabled = false; });
      meter?.remove();
      recBanner.hidden = true;
      activeRecording = null;
    };
    const stop = (): void => {
      if (finished) return;
      finished = true;
      if (recorder?.state === 'recording') recorder.stop(); // onstop saves and cleans up
      else { cleanUp(); setMessage('Recording cancelled. Nothing was saved.'); }
    };
    activeRecording = { word, stop };

    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      finished = true;
      cleanUp();
      setMessage('Microphone permission was not given. You can allow it in Settings → Safari, or import an audio file instead.', true);
      return;
    }
    if (finished) { cleanUp(); return; } // cancelled while the mic was opening

    const type = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'].find(t => MediaRecorder.isTypeSupported?.(t)) ?? '';
    try {
      recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    } catch {
      finished = true;
      cleanUp();
      setMessage('This browser could not start recording. Try importing an audio file instead.', true);
      return;
    }
    const chunks: BlobPart[] = [];
    const activeRecorder = recorder;
    activeRecorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    activeRecorder.onstop = async () => {
      cleanUp();
      play('rec-stop', true);
      try {
        await saveRecording(word, new Blob(chunks, { type: activeRecorder.mimeType || type || 'audio/mp4' }));
        setMessage(`✓ Saved your recording of "${word}" (${Math.max(1, Math.round((Date.now() - startedAt) / 1000))} s). It will play instead of the iPad voice.`);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not save the recording.', true);
      }
      refresh(weekId);
    };

    // Live input level, where the browser can analyse a microphone stream.
    meter = document.createElement('span');
    meter.className = 'rec-meter';
    meter.setAttribute('aria-hidden', 'true');
    const level = document.createElement('span');
    level.className = 'rec-level';
    meter.append(level);
    button.parentElement?.append(meter);
    try {
      const Ctor = window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('no Web Audio');
      analyserCtx = new Ctor();
      const analyser = analyserCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserCtx.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const tick = (): void => {
        analyser.getByteTimeDomainData(samples);
        let peak = 0;
        for (const v of samples) peak = Math.max(peak, Math.abs(v - 128));
        level.style.width = `${Math.min(100, Math.round((peak / 128) * 160))}%`;
        raf = window.requestAnimationFrame(tick);
      };
      tick();
    } catch {
      meter.remove();
      meter = null;
    }

    // Start tone, then open recording just after it so the tone isn't captured.
    button.textContent = '● Get ready…';
    recBanner.textContent = `● Get ready to say “${word}”…`;
    play('rec-start', true);
    window.setTimeout(() => {
      if (finished) return;
      try {
        activeRecorder.start();
      } catch {
        finished = true;
        cleanUp();
        setMessage('Recording could not start. Try again, or import an audio file instead.', true);
        return;
      }
      startedAt = Date.now();
      const update = (): void => {
        const left = Math.max(0, Math.ceil((MAX_RECORD_MS - (Date.now() - startedAt)) / 1000));
        button.textContent = `■ Stop · ${left}`;
        recBanner.textContent = `● Recording “${word}” — say it clearly. ${left} s left · tap Stop when done.`;
      };
      update();
      setMessage(`🔴 Recording "${word}"…`);
      countdown = window.setInterval(update, 250);
      deadline = window.setTimeout(stop, MAX_RECORD_MS);
    }, START_TONE_GAP_MS);
  }

  async function removeRecording(word: string, weekId: string): Promise<void> {
    if (!window.confirm(`Delete your recording of "${word}"? The iPad voice will be used instead.`)) return;
    try { await deleteRecording(word); setMessage(`Recording for "${word}" deleted.`); }
    catch { setMessage('Could not delete that recording.', true); }
    refresh(weekId);
  }

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    const word = recordingFor;
    fileInput.value = '';
    recordingFor = null;
    if (!file || !word) return;
    try {
      await saveRecording(word, file);
      setMessage(`Saved the audio file for "${word}".`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not use that audio file.', true);
    }
    refresh(selectedWeekId);
  });

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
    stopActiveRecording();
    const wasOpen = !overlay.hidden;
    overlay.hidden = true;
    if (wasOpen) window.dispatchEvent(new Event(eventChanged));
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

  // Game version and updates.
  const updateCheck = get<HTMLButtonElement>('update-check');
  const updateInstall = get<HTMLButtonElement>('update-install');
  const updateStatus = get<HTMLParagraphElement>('update-status');
  get<HTMLElement>('app-version').textContent = versionLabel();
  const setUpdateStatus = (text: string, isError = false): void => {
    updateStatus.textContent = text;
    updateStatus.classList.toggle('error-text', isError);
  };
  const showUpdateReady = (): void => {
    updateInstall.hidden = false;
    setUpdateStatus('A new version is ready. Updating restarts the game; the adventure, words and recordings are all saved.');
  };
  if (isUpdateReady()) showUpdateReady();
  window.addEventListener(UPDATE_READY_EVENT, showUpdateReady);
  updateCheck.addEventListener('click', () => {
    updateCheck.disabled = true;
    setUpdateStatus('Checking for a new version…');
    void checkForUpdate().then(result => {
      updateCheck.disabled = false;
      if (result === 'ready') showUpdateReady();
      else if (result === 'downloading') setUpdateStatus('Found a new version. Downloading it now…');
      else if (result === 'current') setUpdateStatus('You have the newest version. ✓');
      else if (result === 'offline') setUpdateStatus('Could not check right now. Make sure the iPad is online, then try again.', true);
      else setUpdateStatus('This browser cannot check for updates here. Reloading the page gets the newest version.', true);
    });
  });
  updateInstall.addEventListener('click', () => {
    stopActiveRecording();
    updateInstall.disabled = true;
    setUpdateStatus('Updating… the game will restart in a moment.');
    installUpdate();
  });

  window.addEventListener(eventParent, open);
  get<HTMLButtonElement>('parent-close').addEventListener('click', close);
  get<HTMLButtonElement>('adult-unlock').addEventListener('click', unlock);
  answer.addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
  wordsInput.addEventListener('input', updateCounter);

  weekPicker.addEventListener('change', () => {
    stopActiveRecording();
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
      const before = peekCampaign();
      const midRun = !!before && (before.nextLevelIndex > 0 || !!before.level) && before.nextLevelIndex < CAMPAIGN_LEVEL_COUNT;
      const week = saveWeek(weekName.value, parseWords(wordsInput.value), selectedWeekId);
      refresh(week.id);
      setMessage(midRun
        ? `Saved! Because the word list changed, the next play starts a fresh ${CAMPAIGN_LEVEL_COUNT}-level adventure with this list. Practice history for each word is kept.`
        : `Saved on this iPad! Every word on this list will appear across the ${CAMPAIGN_LEVEL_COUNT} levels.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save list.', true);
    }
  });

  function practice(mode: 'campaign' | 'review' | 'test'): void {
    try {
      if (!selectedWeekId) { setMessage('Save a week first.', true); return; }
      activateWeek(selectedWeekId);
      close();
      if (mode === 'campaign') window.dispatchEvent(new Event(eventPlay));
      else window.dispatchEvent(new CustomEvent(eventPractice, { detail: { mode } }));
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
  get<HTMLButtonElement>('recordings-export').addEventListener('click', async () => {
    try {
      const { json, count } = await exportRecordings();
      if (!count) { setMessage('There are no recordings to back up yet.'); return; }
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'robot-bunnies-recordings-backup.json';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage(`Backed up ${count} recording${count === 1 ? '' : 's'}. Keep this file private.`);
    } catch { setMessage('Could not back up recordings.', true); }
  });
  get<HTMLInputElement>('recordings-import').addEventListener('change', async e => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 60 * 1024 * 1024) throw new Error('This recordings backup is too large.');
      const count = await importRecordings(await file.text());
      setMessage(`Restored ${count} recording${count === 1 ? '' : 's'}.`);
      refresh(selectedWeekId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not restore recordings.', true);
    } finally { input.value = ''; }
  });
  get<HTMLButtonElement>('recordings-erase').addEventListener('click', async () => {
    if (!window.confirm('Delete ALL voice recordings on this iPad? The iPad voice will be used instead.')) return;
    try { await eraseRecordings(); setMessage('All recordings deleted.'); refresh(selectedWeekId); }
    catch { setMessage('Could not delete recordings.', true); }
  });
  get<HTMLButtonElement>('spelling-erase').addEventListener('click', () => {
    if (!window.confirm('Permanently erase ALL spelling lists and practice history on this iPad? Export a backup first if you want to keep them.')) return;
    eraseSpellingData();
    refresh();
    setMessage('Local spelling lists and practice history erased.');
  });
}
