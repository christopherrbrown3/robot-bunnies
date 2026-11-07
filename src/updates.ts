/**
 * Game updates. The installed game keeps its own copy on the iPad (a service
 * worker), so it starts fast and works offline. When a new version is
 * published, it downloads in the background and then WAITS: nothing reloads by
 * itself, so a level, a spelling answer or a voice recording is never cut off.
 * The title screen and map then show an "Update" button, and Parent Corner can
 * check for and install updates. If nobody taps it, the new version starts the
 * next time the game is fully closed and opened again.
 *
 * The game checks for a new version when it starts, whenever it comes back on
 * screen (iPads keep home-screen apps paused in the background for days), and
 * every 30 minutes while it is open.
 */
import { registerSW } from 'virtual:pwa-register';

export const APP_VERSION = __APP_VERSION__;
export const APP_COMMIT = __APP_COMMIT__;
export const APP_BUILT = __APP_BUILT__;

/** Fired on window when a new version has downloaded and is ready to install. */
export const UPDATE_READY_EVENT = 'robot-bunnies:update-ready';

const CHECK_EVERY_MS = 30 * 60 * 1000;
const RECHECK_ON_RETURN_MS = 5 * 60 * 1000;
const JUST_UPDATED_KEY = 'robot-bunnies.just-updated';

let registration: ServiceWorkerRegistration | undefined;
let ready = false;
let lastCheck = 0;
let installing = false;
let applyUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined;

/** "v0.1.0 · f9eafe9 · Nov 7, 2026": which version is installed on this iPad. */
export function versionLabel(): string {
  const built = new Date(APP_BUILT);
  const date = Number.isNaN(built.getTime()) ? '' : built.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return [`v${APP_VERSION}`, APP_COMMIT === 'local' ? 'local build' : APP_COMMIT, date].filter(Boolean).join(' · ');
}

function markReady(): void {
  if (ready) return;
  ready = true;
  window.dispatchEvent(new Event(UPDATE_READY_EVENT));
}

/** Quietly look for a new version (errors such as being offline are ignored). */
async function backgroundCheck(): Promise<void> {
  if (!registration || ready || installing) return;
  lastCheck = Date.now();
  try { await registration.update(); } catch { /* offline or server unreachable: try again later */ }
}

export function initializeUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh: markReady,
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      registration = reg;
      lastCheck = Date.now();
      if (reg.waiting && navigator.serviceWorker.controller) markReady();
      // registerSW only reports the first update found soon after start-up; watch for later
      // ones too (an iPad can leave the game open for days).
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) markReady();
        });
      });
      window.setInterval(() => { if (!document.hidden) void backgroundCheck(); }, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && Date.now() - lastCheck > RECHECK_ON_RETURN_MS) void backgroundCheck();
      });
    }
  });
}

/** A new version has downloaded and can be installed now. */
export function isUpdateReady(): boolean {
  return ready;
}

export type UpdateCheck = 'ready' | 'downloading' | 'current' | 'offline' | 'unavailable';

/** Check now (Parent Corner). 'downloading' becomes ready shortly; listen for UPDATE_READY_EVENT. */
export async function checkForUpdate(): Promise<UpdateCheck> {
  if (ready) return 'ready';
  if (!registration) return 'unavailable';
  lastCheck = Date.now();
  try {
    await registration.update();
  } catch {
    return 'offline';
  }
  if (registration.waiting) { markReady(); return 'ready'; }
  if (ready) return 'ready';
  return registration.installing ? 'downloading' : 'current';
}

/**
 * Switch to the new version: the waiting copy takes over and the page reloads.
 * Only call this where progress is already saved (menus, Parent Corner).
 */
export function installUpdate(): void {
  if (installing) return;
  installing = true;
  try { sessionStorage.setItem(JUST_UPDATED_KEY, '1'); } catch { /* private mode */ }
  // Reload once the new version is in control, or after a few seconds if that never happens.
  let reloaded = false;
  const reload = (): void => { if (!reloaded) { reloaded = true; window.location.reload(); } };
  navigator.serviceWorker?.addEventListener('controllerchange', reload);
  const fallback = window.setTimeout(reload, 4000);
  if (!applyUpdate) {
    window.clearTimeout(fallback);
    reload();
    return;
  }
  applyUpdate(true).catch(() => {
    window.clearTimeout(fallback);
    reload();
  });
}

/** True once, right after the game restarted into a new version. */
export function consumeJustUpdated(): boolean {
  try {
    if (sessionStorage.getItem(JUST_UPDATED_KEY) !== '1') return false;
    sessionStorage.removeItem(JUST_UPDATED_KEY);
    return true;
  } catch {
    return false;
  }
}
