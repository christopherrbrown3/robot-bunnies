/** Navigation helpers shared by menu scenes. */
import Phaser from 'phaser';
import levelsJson from '../content/levels.json';
import type { LevelOutline } from '../content/types';
import { CAMPAIGN_LEVEL_COUNT, getOrStartCampaign } from '../spelling/campaign';
import { getActiveWeek, loadSpellingData } from '../spelling/store';
import { UPDATE_READY_EVENT, installUpdate, isUpdateReady } from '../updates';
import { prefersReducedMotion } from '../audio/prefs';
import { makeButton } from './ui';

export const levels = levelsJson as LevelOutline[];
export const PARENT_EVENT = 'robot-bunnies:open-parent';

export function hasActiveList(): boolean {
  try {
    return (getActiveWeek(loadSpellingData())?.words.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/** Continue the saved run (or start one), showing the level's story first if it is fresh. */
export function startAdventure(scene: Phaser.Scene): void {
  if (!hasActiveList()) {
    window.dispatchEvent(new Event(PARENT_EVENT));
    return;
  }
  try {
    const campaign = getOrStartCampaign();
    const index = Math.min(campaign.nextLevelIndex, CAMPAIGN_LEVEL_COUNT - 1);
    const cut = levels[index].play.cutscene;
    if (!campaign.level && cut) scene.scene.start('Cutscene', { id: cut, next: 'Game' });
    else scene.scene.start('Game');
  } catch {
    window.dispatchEvent(new Event(PARENT_EVENT));
  }
}

/**
 * "New version" button for menu screens (title, map). It appears once an update
 * has downloaded, including while the screen is open, and never during a level,
 * so progress is always saved before the game restarts into the new version.
 */
export function addUpdateButton(scene: Phaser.Scene, x: number, y: number, w: number): void {
  let button: Phaser.GameObjects.Container | undefined;
  const show = (): void => {
    if (button || !isUpdateReady()) return;
    button = makeButton(scene, x, y, w, 52, '✨ New version! Update', () => {
      (button?.list[1] as Phaser.GameObjects.Text | undefined)?.setText('Updating… 🐰');
      button?.disableInteractive();
      installUpdate();
    }, { color: 0x2f9a6a, fontSize: 20 }).setDepth(90);
    if (!prefersReducedMotion()) scene.tweens.add({ targets: button, scale: 1.05, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  show();
  window.addEventListener(UPDATE_READY_EVENT, show);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener(UPDATE_READY_EVENT, show));
}

/** Re-render a menu scene when Parent Corner or a practice session changes saved data. */
export function refreshOnDataChange(scene: Phaser.Scene): void {
  const handler = (): void => { if (scene.scene.isActive()) scene.scene.restart(); };
  window.addEventListener('robot-bunnies:data-changed', handler);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => window.removeEventListener('robot-bunnies:data-changed', handler));
}
